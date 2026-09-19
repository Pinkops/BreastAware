import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, serverError } from './_util.js';

const CATEGORIES = ['question', 'symptom', 'history', 'medication', 'goal', 'other'];
const FIELDS = ['category', 'content', 'is_priority', 'included_in_summary', 'is_complete'];
const LIMITS = { content: 4000 };
const BOOLEANS = ['is_priority', 'included_in_summary', 'is_complete'];

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ba_doctor_prep')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.content || !String(b.content).trim()) {
        return res.status(400).json({ error: 'content required' });
      }
      if (!CATEGORIES.includes(b.category || 'question')) {
        return res.status(400).json({ error: 'category must be one of: ' + CATEGORIES.join(', ') });
      }
      const row = {
        user_id: user.id,
        category: b.category || 'question',
        content: String(b.content).slice(0, 4000),
        is_priority: b.is_priority === true,
        included_in_summary: b.included_in_summary !== false,
        is_complete: b.is_complete === true,
      };
      const { data, error } = await supabase.from('ba_doctor_prep').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: 'id required' });
      if (b.category !== undefined && !CATEGORIES.includes(b.category)) {
        return res.status(400).json({ error: 'category must be one of: ' + CATEGORIES.join(', ') });
      }
      const updates = pick(b, FIELDS, { limits: LIMITS, booleans: BOOLEANS });
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'no valid fields to update' });
      }
      const { data, error } = await supabase
        .from('ba_doctor_prep')
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
      const { error } = await supabase.from('ba_doctor_prep').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'doctor-prep error');
  }
}
