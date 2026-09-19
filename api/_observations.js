import supabase from './_db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, clampNumber, validDate, serverError } from './_util.js';

const CHANGE_TYPES = [
  'lump_or_thickening', 'skin_change', 'nipple_change', 'discharge',
  'pain_or_tenderness', 'swelling', 'shape_change', 'other',
];
const SIDES = ['left', 'right', 'both', 'not_specified'];
const FIELDS = [
  'observed_at', 'change_type', 'side', 'location_description', 'location_x', 'location_y',
  'size_description', 'texture', 'pain_level', 'duration', 'associated_symptoms',
  'notes', 'discussed_with_provider',
];
const LIMITS = {
  location_description: 300, size_description: 100, texture: 100, duration: 100, notes: 4000,
};
const BOOLEANS = ['discussed_with_provider'];

function normalize(b) {
  return {
    change_type: CHANGE_TYPES.includes(b.change_type) ? b.change_type : undefined,
    side: SIDES.includes(b.side) ? b.side : 'not_specified',
    pain_level: clampNumber(b.pain_level, 0, 10),
    associated_symptoms: Array.isArray(b.associated_symptoms)
      ? b.associated_symptoms.slice(0, 20).map((s) => String(s).slice(0, 50))
      : [],
  };
}

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
      if (!CHANGE_TYPES.includes(b.change_type)) {
        return res.status(400).json({ error: 'change_type must be one of: ' + CHANGE_TYPES.join(', ') });
      }
      if (b.observed_at && !validDate(b.observed_at)) {
        return res.status(400).json({ error: 'observed_at must be a valid date' });
      }
      const n = normalize(b);
      const row = {
        user_id: user.id,
        observed_at: b.observed_at ? new Date(b.observed_at).toISOString() : new Date().toISOString(),
        change_type: n.change_type,
        side: n.side,
        location_description: String(b.location_description || '').slice(0, 300),
        location_x: clampNumber(b.location_x, 0, 100),
        location_y: clampNumber(b.location_y, 0, 100),
        size_description: String(b.size_description || '').slice(0, 100),
        texture: String(b.texture || '').slice(0, 100),
        pain_level: n.pain_level,
        duration: String(b.duration || '').slice(0, 100),
        associated_symptoms: n.associated_symptoms,
        notes: String(b.notes || '').slice(0, 4000),
        discussed_with_provider: b.discussed_with_provider === true,
      };
      const { data, error } = await supabase.from('ba_observations').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: 'id required' });
      if (b.change_type !== undefined && !CHANGE_TYPES.includes(b.change_type)) {
        return res.status(400).json({ error: 'change_type must be one of: ' + CHANGE_TYPES.join(', ') });
      }
      if (b.side !== undefined && !SIDES.includes(b.side)) {
        return res.status(400).json({ error: 'side must be one of: ' + SIDES.join(', ') });
      }
      if (b.observed_at !== undefined && !validDate(b.observed_at)) {
        return res.status(400).json({ error: 'observed_at must be a valid date' });
      }
      const updates = pick(b, FIELDS, { limits: LIMITS, booleans: BOOLEANS });
      if (updates.pain_level !== undefined) updates.pain_level = clampNumber(updates.pain_level, 0, 10);
      if (updates.associated_symptoms !== undefined && !Array.isArray(updates.associated_symptoms)) {
        delete updates.associated_symptoms;
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'no valid fields to update' });
      }
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('ba_observations')
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
      const { error } = await supabase.from('ba_observations').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'observations error');
  }
}
