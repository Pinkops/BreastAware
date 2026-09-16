import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const tables = [
        'ba_profiles',
        'ba_normal_baselines',
        'ba_observations',
        'ba_body_map_markers',
        'ba_screenings',
        'ba_appointments',
        'ba_risk_notes',
        'ba_doctor_prep',
        'ba_vault_documents',
        'ba_check_ins',
      ];
      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user.email,
        app: 'BREASTAWARE',
        note: 'Personal health organizer export. Not a medical record or diagnosis.',
      };

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id);
        if (error) throw error;
        exportData[table] = data || [];
      }

      return res.status(200).json(exportData);
    }

    if (req.method === 'DELETE') {
      const confirm = req.body?.confirm;
      if (confirm !== 'DELETE_MY_DATA') {
        return res.status(400).json({ error: 'Confirmation required' });
      }
      const tables = [
        'ba_check_ins',
        'ba_vault_documents',
        'ba_doctor_prep',
        'ba_risk_notes',
        'ba_appointments',
        'ba_screenings',
        'ba_body_map_markers',
        'ba_observations',
        'ba_normal_baselines',
        'ba_profiles',
      ];
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('user_id', user.id);
        if (error) throw error;
      }
      try {
        const { data: files } = await supabase.storage.from('ba-vault').list(user.id);
        if (files?.length) {
          await supabase.storage.from('ba-vault').remove(files.map((f) => `${user.id}/${f.name}`));
        }
      } catch {}
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('export error:', err);
    res.status(500).json({ error: err.message });
  }
}
