import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, clampNumber, serverError } from './_util.js';

const FIELDS = ['side', 'label', 'notes', 'x_pct', 'y_pct', 'observation_id'];
const LIMITS = { side: 20, label: 100, notes: 2000 };

function clampCoords(row) {
  if (row.x_pct !== undefined) row.x_pct = clampNumber(row.x_pct, 0, 100);
  if (row.y_pct !== undefined) row.y_pct = clampNumber(row.y_pct, 0, 100);
  if (row.observation_id !== undefined && row.observation_id !== null) {
    const n = Number(row.observation_id);
    row.observation_id = Number.isInteger(n) ? n : null;
  }
  return row;
}

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
      const x = clampNumber(b.x_pct, 0, 100);
      const y = clampNumber(b.y_pct, 0, 100);
      if (x === null || y === null) {
        return res.status(400).json({ error: 'x_pct and y_pct must be numbers between 0 and 100' });
      }
      const row = {
        user_id: user.id,
        side: String(b.side || 'front').slice(0, 20),
        x_pct: x,
        y_pct: y,
        label: String(b.label || 'Noted area').slice(0, 100),
        notes: String(b.notes || '').slice(0, 2000),
        observation_id: Number.isInteger(Number(b.observation_id)) && b.observation_id != null ? Number(b.observation_id) : null,
      };
      const { data, error } = await supabase.from('ba_body_map_markers').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: 'id required' });
      const updates = clampCoords(pick(b, FIELDS, { limits: LIMITS }));
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'no valid fields to update' });
      }
      const { data, error } = await supabase
        .from('ba_body_map_markers')
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
      const { error } = await supabase.from('ba_body_map_markers').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'body-map error');
  }
}
