import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, validDate, serverError } from './_util.js';

const FIELDS = ['title', 'provider_name', 'appointment_date', 'appointment_time', 'location', 'notes', 'completed'];
const LIMITS = { title: 200, provider_name: 200, appointment_time: 20, location: 300, notes: 2000 };
const BOOLEANS = ['completed'];

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
      if (!b.title || !validDate(b.appointment_date)) {
        return res.status(400).json({ error: 'title and a valid appointment_date are required' });
      }
      const row = {
        user_id: user.id,
        title: String(b.title).slice(0, 200),
        provider_name: String(b.provider_name || '').slice(0, 200),
        appointment_date: b.appointment_date,
        appointment_time: String(b.appointment_time || '').slice(0, 20),
        location: String(b.location || '').slice(0, 300),
        notes: String(b.notes || '').slice(0, 2000),
        completed: b.completed === true,
      };
      const { data, error } = await supabase.from('ba_appointments').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: 'id required' });
      if (b.appointment_date !== undefined && !validDate(b.appointment_date)) {
        return res.status(400).json({ error: 'appointment_date must be a valid date' });
      }
      const updates = pick(b, FIELDS, { limits: LIMITS, booleans: BOOLEANS });
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'no valid fields to update' });
      }
      const { data, error } = await supabase
        .from('ba_appointments')
        .update(updates)
        .eq('id', b.id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('ba_appointments').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'appointments error');
  }
}
