import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ba_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(data || null);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      const row = {
        user_id: user.id,
        display_name: body.display_name ?? null,
        preferred_name: body.preferred_name ?? null,
        onboarding_complete: body.onboarding_complete ?? false,
        age_range: body.age_range ?? null,
        timezone: body.timezone ?? 'America/New_York',
        updated_at: new Date().toISOString(),
      };
      const { data: existing } = await supabase
        .from('ba_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      let result;
      if (existing?.id) {
        result = await supabase.from('ba_profiles').update(row).eq('id', existing.id).select().single();
      } else {
        result = await supabase.from('ba_profiles').insert(row).select().single();
      }
      if (result.error) throw result.error;
      return res.status(200).json(result.data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profile error:', err);
    res.status(500).json({ error: err.message });
  }
}
