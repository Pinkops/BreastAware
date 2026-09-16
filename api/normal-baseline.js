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
        .from('ba_normal_baselines')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(data || null);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const b = req.body || {};
      const row = {
        user_id: user.id,
        look_notes: b.look_notes ?? '',
        feel_notes: b.feel_notes ?? '',
        size_shape_notes: b.size_shape_notes ?? '',
        texture_notes: b.texture_notes ?? '',
        nipple_notes: b.nipple_notes ?? '',
        cycle_notes: b.cycle_notes ?? '',
        asymmetry_notes: b.asymmetry_notes ?? '',
        other_notes: b.other_notes ?? '',
        updated_at: new Date().toISOString(),
      };
      const { data: existing } = await supabase
        .from('ba_normal_baselines')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      let result;
      if (existing?.id) {
        result = await supabase.from('ba_normal_baselines').update(row).eq('id', existing.id).select().single();
      } else {
        result = await supabase.from('ba_normal_baselines').insert(row).select().single();
      }
      if (result.error) throw result.error;
      return res.status(200).json(result.data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('normal-baseline error:', err);
    res.status(500).json({ error: err.message });
  }
}
