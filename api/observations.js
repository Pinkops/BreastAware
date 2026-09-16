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
        .from('ba_observations')
        .select('*')
        .eq('user_id', user.id)
        .order('observed_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.change_type) return res.status(400).json({ error: 'change_type is required' });
      const row = {
        user_id: user.id,
        observed_at: b.observed_at || new Date().toISOString(),
        change_type: b.change_type,
        side: b.side || 'not_specified',
        location_description: b.location_description || '',
        location_x: b.location_x ?? null,
        location_y: b.location_y ?? null,
        size_description: b.size_description || '',
        texture: b.texture || '',
        pain_level: b.pain_level ?? null,
        duration: b.duration || '',
        associated_symptoms: b.associated_symptoms || [],
        notes: b.notes || '',
        discussed_with_provider: b.discussed_with_provider ?? false,
      };
      const { data, error } = await supabase
        .from('ba_observations')
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
        .from('ba_observations')
        .update({ ...updates, updated_at: new Date().toISOString() })
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
        .from('ba_observations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('observations error:', err);
    res.status(500).json({ error: err.message });
  }
}
