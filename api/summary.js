import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const [
        profileRes,
        baselineRes,
        obsRes,
        screenRes,
        apptRes,
        riskRes,
        prepRes,
        markersRes,
      ] = await Promise.all([
        supabase.from('ba_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('ba_normal_baselines').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('ba_observations').select('*').eq('user_id', user.id).order('observed_at', { ascending: false }).limit(50),
        supabase.from('ba_screenings').select('*').eq('user_id', user.id).order('screening_date', { ascending: false }),
        supabase.from('ba_appointments').select('*').eq('user_id', user.id).order('appointment_date', { ascending: true }),
        supabase.from('ba_risk_notes').select('*').eq('user_id', user.id),
        supabase.from('ba_doctor_prep').select('*').eq('user_id', user.id).eq('included_in_summary', true),
        supabase.from('ba_body_map_markers').select('*').eq('user_id', user.id),
      ]);

      const summary = {
        generated_at: new Date().toISOString(),
        disclaimer:
          'This personal summary is for conversation support only. It is not a medical diagnosis, screening result, or clinical assessment. Share it with a qualified healthcare professional for interpretation.',
        profile: profileRes.data,
        normal_baseline: baselineRes.data,
        observations: obsRes.data || [],
        screenings: screenRes.data || [],
        appointments: apptRes.data || [],
        risk_notes: riskRes.data || [],
        doctor_prep: prepRes.data || [],
        body_map_markers: markersRes.data || [],
      };

      return res.status(200).json(summary);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('summary error:', err);
    res.status(500).json({ error: err.message });
  }
}
