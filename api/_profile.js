import supabase from './_db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, serverError } from './_util.js';

const FIELDS = ['display_name', 'preferred_name', 'onboarding_complete', 'age_range', 'timezone'];
const LIMITS = { display_name: 100, preferred_name: 100, age_range: 10, timezone: 60 };
const BOOLEANS = ['onboarding_complete'];

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ba_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(data || null);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      // Merge semantics (BA-021/BA-025): only fields present in the request are
      // written. A partial save can never blank out fields you did not send.
      const updates = pick(body, FIELDS, { limits: LIMITS, booleans: BOOLEANS });
      updates.updated_at = new Date().toISOString();

      const { data: existing } = await supabase
        .from('ba_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existing?.id) {
        result = await supabase
          .from('ba_profiles')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('ba_profiles')
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();
      }
      if (result.error) throw result.error;
      return res.status(200).json(result.data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'profile error');
  }
}
