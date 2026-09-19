import supabase from './_db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, serverError } from './_util.js';

// BA-NEW: Visit Readiness — structured prep, no scoring, no diagnosis
// Stores per-question answers, owner-only via RLS

const FIELDS = ['question_key', 'answer', 'include_in_summary'];
const LIMITS = { question_key: 100, answer: 2000 };
const BOOLEANS = ['include_in_summary'];

// Allowed question keys (from frontend QUESTIONS constant) — prevents arbitrary keys
const ALLOWED_KEYS = new Set([
  // Section 1: History of lump/change
  'lump_when_first', 'lump_where_exact', 'lump_size_change', 'lump_pain_tender',
  'lump_cycle_change', 'lump_how_many', 'lump_armpit_collarbone', 'lump_recent_injury_infection',
  // Section 2: Other breast symptoms
  'symptom_discharge', 'symptom_nipple_inversion', 'symptom_skin_changes',
  'symptom_size_shape', 'symptom_swelling_pain', 'symptom_other_breast',
  // Section 3: Menstrual, pregnancy, hormone
  'hormone_last_period', 'hormone_regular', 'hormone_pregnant_breastfeeding',
  'hormone_periods_started', 'hormone_menopause', 'hormone_contraception_hrt',
  'hormone_fertility_other',
  // Section 4: Personal medical & breast history
  'personal_prev_lumps', 'personal_prev_biopsy', 'personal_surgery_implants',
  'personal_cancer_history', 'personal_chest_radiation', 'personal_other_conditions',
  'personal_medicines', 'personal_allergies',
  // Section 5: Family history
  'family_mother_sisters_daughters', 'family_aunts_grandmothers', 'family_male_breast',
  'family_age_diagnosed', 'family_bilateral', 'family_ovarian_pancreatic_prostate',
  'family_multiple_young', 'family_known_mutations',
  // Section 6: Lifestyle + what to bring
  'lifestyle_smoking', 'lifestyle_alcohol', 'lifestyle_weight_activity',
  'lifestyle_other_drugs', 'lifestyle_other_health_changes', 'bring_what_to_bring',
]);

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ba_visit_readiness')
        .select('*')
        .eq('user_id', user.id)
        .order('question_key', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      const items = Array.isArray(body.items) ? body.items : [body];

      const results = [];
      for (const raw of items) {
        const b = raw || {};
        if (!b.question_key || !ALLOWED_KEYS.has(String(b.question_key).slice(0, 100))) {
          continue;
        }
        const row = {
          user_id: user.id,
          question_key: String(b.question_key).slice(0, 100),
          answer: String(b.answer || '').slice(0, 2000),
          include_in_summary: b.include_in_summary !== false,
          updated_at: new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from('ba_visit_readiness')
          .select('id')
          .eq('user_id', user.id)
          .eq('question_key', row.question_key)
          .maybeSingle();

        let result;
        if (existing?.id) {
          result = await supabase
            .from('ba_visit_readiness')
            .update({ answer: row.answer, include_in_summary: row.include_in_summary, updated_at: row.updated_at })
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from('ba_visit_readiness')
            .insert(row)
            .select()
            .single();
        }
        if (result.error) throw result.error;
        results.push(result.data);
      }

      return res.status(200).json(results.length === 1 ? results[0] : results);
    }

    if (req.method === 'DELETE') {
      const { question_key } = req.body || {};
      if (question_key) {
        if (!ALLOWED_KEYS.has(String(question_key).slice(0, 100))) {
          return res.status(400).json({ error: 'Invalid question_key' });
        }
        const { error } = await supabase
          .from('ba_visit_readiness')
          .delete()
          .eq('user_id', user.id)
          .eq('question_key', String(question_key).slice(0, 100));
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ba_visit_readiness')
          .delete()
          .eq('user_id', user.id);
        if (error) throw error;
      }
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'visit-readiness error');
  }
}
