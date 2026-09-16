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
        .from('ba_appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.title || !b.appointment_date) {
        return res.status(400).json({ error: 'title and appointment_date required' });
      }
      const row = {
        user_id: user.id,
        title: b.title,
        provider_name: b.provider_name || '',
        appointment_date: b.appointment_date,
        appointment_time: b.appointment_time || '',
        location: b.location || '',
        notes: b.notes || '',
        completed: b.completed ?? false,
      };
      const { data, error } = await supabase
        .from('ba_appointments')
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
        .from('ba_appointments')
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
        .from('ba_appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('appointments error:', err);
    res.status(500).json({ error: err.message });
  }
}
