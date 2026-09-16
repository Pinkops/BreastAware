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
        .from('ba_screenings')
        .select('*')
        .eq('user_id', user.id)
        .order('screening_date', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.screening_type || !b.screening_date) {
        return res.status(400).json({ error: 'screening_type and screening_date required' });
      }
      const row = {
        user_id: user.id,
        screening_type: b.screening_type,
        facility: b.facility || '',
        screening_date: b.screening_date,
        result_summary: b.result_summary || '',
        next_due_date: b.next_due_date || null,
        notes: b.notes || '',
      };
      const { data, error } = await supabase
        .from('ba_screenings')
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
        .from('ba_screenings')
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
        .from('ba_screenings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('screenings error:', err);
    res.status(500).json({ error: err.message });
  }
}
