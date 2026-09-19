import supabase from './_db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, serverError } from './_util.js';

const FIELDS = [
  'look_notes', 'feel_notes', 'size_shape_notes', 'texture_notes',
  'nipple_notes', 'cycle_notes', 'asymmetry_notes', 'other_notes',
];
const LIMITS = Object.fromEntries(FIELDS.map((f) => [f, 2000]));

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
      // Merge semantics (BA-021): only fields present in the request are
      // written; fields you did not send are left untouched, never blanked.
      const updates = pick(b, FIELDS, { limits: LIMITS });
      updates.updated_at = new Date().toISOString();

      const { data: existing } = await supabase
        .from('ba_normal_baselines')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existing?.id) {
        result = await supabase
          .from('ba_normal_baselines')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('ba_normal_baselines')
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();
      }
      if (result.error) throw result.error;
      return res.status(200).json(result.data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'normal-baseline error');
  }
}
