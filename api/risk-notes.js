import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, serverError } from './_util.js';

const CATEGORIES = ['family_history', 'personal_history', 'genetic', 'lifestyle', 'other'];
const FIELDS = ['category', 'description', 'notes'];
const LIMITS = { description: 4000, notes: 2000 };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ba_risk_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!CATEGORIES.includes(b.category)) {
        return res.status(400).json({ error: 'category must be one of: ' + CATEGORIES.join(', ') });
      }
      if (!b.description || !String(b.description).trim()) {
        return res.status(400).json({ error: 'description required' });
      }
      const row = {
        user_id: user.id,
        category: b.category,
        description: String(b.description).slice(0, 4000),
        notes: String(b.notes || '').slice(0, 2000),
      };
      const { data, error } = await supabase.from('ba_risk_notes').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: 'id required' });
      if (b.category !== undefined && !CATEGORIES.includes(b.category)) {
        return res.status(400).json({ error: 'category must be one of: ' + CATEGORIES.join(', ') });
      }
      const updates = pick(b, FIELDS, { limits: LIMITS });
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'no valid fields to update' });
      }
      const { data, error } = await supabase
        .from('ba_risk_notes')
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
      const { error } = await supabase.from('ba_risk_notes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'risk-notes error');
  }
}
