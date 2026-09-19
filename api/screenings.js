import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, validDate, serverError } from './_util.js';

const TYPES = ['mammogram', 'clinical_breast_exam', 'ultrasound', 'mri', 'biopsy', 'other'];
const FIELDS = ['screening_type', 'facility', 'screening_date', 'result_summary', 'next_due_date', 'notes'];
const LIMITS = { facility: 200, result_summary: 2000, notes: 2000 };

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
      if (!TYPES.includes(b.screening_type)) {
        return res.status(400).json({ error: 'screening_type must be one of: ' + TYPES.join(', ') });
      }
      if (!validDate(b.screening_date)) {
        return res.status(400).json({ error: 'a valid screening_date is required' });
      }
      if (b.next_due_date && !validDate(b.next_due_date)) {
        return res.status(400).json({ error: 'next_due_date must be a valid date' });
      }
      const row = {
        user_id: user.id,
        screening_type: b.screening_type,
        facility: String(b.facility || '').slice(0, 200),
        screening_date: b.screening_date,
        result_summary: String(b.result_summary || '').slice(0, 2000),
        next_due_date: b.next_due_date || null,
        notes: String(b.notes || '').slice(0, 2000),
      };
      const { data, error } = await supabase.from('ba_screenings').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: 'id required' });
      if (b.screening_type !== undefined && !TYPES.includes(b.screening_type)) {
        return res.status(400).json({ error: 'screening_type must be one of: ' + TYPES.join(', ') });
      }
      if (b.screening_date !== undefined && !validDate(b.screening_date)) {
        return res.status(400).json({ error: 'screening_date must be a valid date' });
      }
      if (b.next_due_date && !validDate(b.next_due_date)) {
        return res.status(400).json({ error: 'next_due_date must be a valid date' });
      }
      const updates = pick(b, FIELDS, { limits: LIMITS });
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'no valid fields to update' });
      }
      const { data, error } = await supabase
        .from('ba_screenings')
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
      const { error } = await supabase.from('ba_screenings').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'screenings error');
  }
}
