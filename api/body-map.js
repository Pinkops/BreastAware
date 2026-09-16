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
        .from('ba_body_map_markers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (b.x_pct == null || b.y_pct == null) {
        return res.status(400).json({ error: 'x_pct and y_pct required' });
      }
      const row = {
        user_id: user.id,
        side: b.side || 'front',
        x_pct: b.x_pct,
        y_pct: b.y_pct,
        label: b.label || 'Noted area',
        notes: b.notes || '',
        observation_id: b.observation_id ?? null,
      };
      const { data, error } = await supabase
        .from('ba_body_map_markers')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase
        .from('ba_body_map_markers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase
        .from('ba_body_map_markers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('body-map error:', err);
    res.status(500).json({ error: err.message });
  }
}
