import { useEffect, useState } from 'react';
import { ClipboardList, Save, Info, Check, Printer } from 'lucide-react';
import { apiGet, apiSend } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

interface Stored {
  question_key: string;
  answer: string;
  include_in_summary: boolean;
}

type Question = {
  key: string;
  label: string;
  hint: string;
  placeholder: string;
  optional?: boolean;
};

type Section = {
  id: string;
  title: string;
  desc: string;
  questions: Question[];
};

const SECTIONS: Section[] = [
  {
    id: 'lump_history',
    title: '1. History of the lump / change',
    desc: 'The details a clinician often asks first to understand timeline and character. Answer in your own words — approximate dates are okay.',
    questions: [
      { key: 'lump_when_first', label: 'When did you first notice it?', hint: 'Approximate date or duration', placeholder: 'e.g., About 3 weeks ago, or March 2026' },
      { key: 'lump_where_exact', label: 'Where exactly is it?', hint: 'Side and location in your own words', placeholder: 'e.g., Left breast, upper outer area, about 2 o\'clock' },
      { key: 'lump_size_change', label: 'Has it increased in size or changed?', hint: 'Growth, shape, feel, or appearance changes', placeholder: 'e.g., Feels slightly larger than last week, no visible change' },
      { key: 'lump_pain_tender', label: 'Is it painful or tender?', hint: 'Pain level, when it occurs', placeholder: 'e.g., Tender when pressed, pain 2/10, comes and goes' },
      { key: 'lump_cycle_change', label: 'Does it change with your menstrual cycle?', hint: 'If applicable — optional', placeholder: 'e.g., More tender before period, or no change with cycle', optional: true },
      { key: 'lump_how_many', label: 'Is there one lump or more than one?', hint: 'Number you have noticed', placeholder: 'e.g., One distinct lump' },
      { key: 'lump_armpit_collarbone', label: 'Have you noticed a lump in armpit or above collarbone?', hint: 'Lymph node areas clinicians often check', placeholder: 'e.g., No, or yes — left armpit, small' },
      { key: 'lump_recent_injury_infection', label: 'Any recent injury, infection, fever, or inflammation in the breast?', hint: 'Recent events that help differentiate causes', placeholder: 'e.g., No injury, no fever, slight redness for 2 days' },
    ],
  },
  {
    id: 'other_symptoms',
    title: '2. Other breast symptoms',
    desc: 'Other changes people are often encouraged to report. Leave blank if not applicable.',
    questions: [
      { key: 'symptom_discharge', label: 'Nipple discharge?', hint: 'Spontaneous? One-sided? Clear, milky, or bloody?', placeholder: 'e.g., No discharge, or yes — left, clear, spontaneous' },
      { key: 'symptom_nipple_inversion', label: 'Nipple inversion or new change in position?', hint: 'New vs long-standing', placeholder: 'e.g., No new inversion, or yes — new inward pulling on right' },
      { key: 'symptom_skin_changes', label: 'Skin changes?', hint: 'Dimpling, puckering, thickening, redness, ulceration, orange-peel', placeholder: 'e.g., No skin changes, or slight dimpling when arm raised' },
      { key: 'symptom_size_shape', label: 'Change in breast size or shape?', hint: 'Compared with your normal', placeholder: 'e.g., Left feels slightly fuller than usual' },
      { key: 'symptom_swelling_pain', label: 'Breast swelling or persistent pain?', hint: 'One area vs whole breast, duration', placeholder: 'e.g., Persistent dull ache in one spot for 1 week' },
      { key: 'symptom_other_breast', label: 'Changes in the other breast?', hint: 'Both sides comparison', placeholder: 'e.g., No changes in right breast' },
    ],
  },
  {
    id: 'hormone_history',
    title: '3. Menstrual, pregnancy & hormone history',
    desc: 'All optional. If applicable to you — helps clinician understand hormonal context. Choose "Prefer not to say" by leaving blank.',
    questions: [
      { key: 'hormone_last_period', label: 'When was your last menstrual period?', hint: 'Optional — approximate date', placeholder: 'e.g., Feb 10, 2026, or prefer not to say', optional: true },
      { key: 'hormone_regular', label: 'Are your periods regular?', hint: 'Optional', placeholder: 'e.g., Regular ~28 days, or irregular', optional: true },
      { key: 'hormone_pregnant_breastfeeding', label: 'Are you pregnant or breastfeeding?', hint: 'Optional', placeholder: 'e.g., No, or breastfeeding — 6 months postpartum', optional: true },
      { key: 'hormone_periods_started', label: 'At what age did your periods begin?', hint: 'Optional', placeholder: 'e.g., Age 13', optional: true },
      { key: 'hormone_menopause', label: 'Have you reached menopause?', hint: 'Optional', placeholder: 'e.g., No, or yes — age 51', optional: true },
      { key: 'hormone_contraception_hrt', label: 'Do you use oral contraceptive, injectable, or HRT?', hint: 'Optional — include names if you want', placeholder: 'e.g., No, or yes — combined pill', optional: true },
      { key: 'hormone_fertility_other', label: 'Fertility treatment or other hormone medicines?', hint: 'Optional', placeholder: 'e.g., None, or levothyroxine', optional: true },
    ],
  },
  {
    id: 'personal_history',
    title: '4. Personal medical & breast history',
    desc: 'Your own history — helps avoid repeating tests and gives context. Only share what you are comfortable storing.',
    questions: [
      { key: 'personal_prev_lumps', label: 'Previous breast lumps or cysts?', hint: 'When, what was found', placeholder: 'e.g., Cyst in 2022, benign on ultrasound' },
      { key: 'personal_prev_biopsy', label: 'Previous breast biopsy or abnormal mammogram?', hint: 'Date and result in your words', placeholder: 'e.g., Biopsy 2021 — fibroadenoma' },
      { key: 'personal_surgery_implants', label: 'Breast surgery, implants, or reconstruction?', hint: 'Type and year', placeholder: 'e.g., No, or implants 2019' },
      { key: 'personal_cancer_history', label: 'Breast cancer or other cancer in the past?', hint: 'Type and year', placeholder: 'e.g., No personal cancer history' },
      { key: 'personal_chest_radiation', label: 'Chest radiation treatment, especially at young age?', hint: 'If applicable', placeholder: 'e.g., No' },
      { key: 'personal_other_conditions', label: 'Other significant medical conditions?', hint: 'Conditions you want your clinician to know', placeholder: 'e.g., Hypertension, hypothyroidism' },
      { key: 'personal_medicines', label: 'Current medicines including hormones and blood thinners?', hint: 'List with doses if you want', placeholder: 'e.g., Amlodipine 5mg daily, multivitamin' },
      { key: 'personal_allergies', label: 'Allergies?', hint: 'Medicines, latex, etc.', placeholder: 'e.g., Penicillin — rash' },
    ],
  },
  {
    id: 'family_history',
    title: '5. Family & inherited-risk history',
    desc: 'First- and second-degree history on both mother’s and father’s sides is commonly recorded. This is family context, not a risk score. All optional.',
    questions: [
      { key: 'family_mother_sisters_daughters', label: 'Mother, sisters, daughters with breast or ovarian cancer?', hint: 'Who and age at diagnosis', placeholder: 'e.g., Mother — breast cancer age 58' },
      { key: 'family_aunts_grandmothers', label: 'Aunts, grandmothers, other close relatives?', hint: 'Both sides of family', placeholder: 'e.g., Maternal aunt — ovarian age 62' },
      { key: 'family_male_breast', label: 'Male relatives with breast cancer?', hint: 'Often overlooked but relevant', placeholder: 'e.g., No' },
      { key: 'family_age_diagnosed', label: 'Age at which relatives were diagnosed?', hint: 'Young ages sometimes noted', placeholder: 'e.g., Mother 58, aunt 62' },
      { key: 'family_bilateral', label: 'Bilateral breast cancer in family?', hint: 'Both breasts', placeholder: 'e.g., No' },
      { key: 'family_ovarian_pancreatic_prostate', label: 'Ovarian, fallopian-tube, pancreatic, or prostate cancer in family?', hint: 'Related cancers sometimes asked', placeholder: 'e.g., Father — prostate age 65' },
      { key: 'family_multiple_young', label: 'Several relatives with cancer or unusually young ages?', hint: 'Pattern', placeholder: 'e.g., No pattern noticed' },
      { key: 'family_known_mutations', label: 'Known BRCA1, BRCA2, PALB2, or other inherited mutations?', hint: 'If you know from genetic counseling', placeholder: 'e.g., No known mutations, or BRCA1 positive 2020' },
    ],
  },
  {
    id: 'lifestyle_bring',
    title: '6. Lifestyle, general health & what to bring',
    desc: 'Optional lifestyle context plus practical checklist so you don’t forget documents.',
    questions: [
      { key: 'lifestyle_smoking', label: 'Cigarette smoking, vaping, tobacco use?', hint: 'Optional', placeholder: 'e.g., Never smoker', optional: true },
      { key: 'lifestyle_alcohol', label: 'Alcohol intake?', hint: 'Optional — general pattern', placeholder: 'e.g., Social, 1-2 drinks/week, or prefer not to say', optional: true },
      { key: 'lifestyle_weight_activity', label: 'Weight changes and physical activity?', hint: 'Optional — recent changes', placeholder: 'e.g., Stable weight, walk 3x/week', optional: true },
      { key: 'lifestyle_other_drugs', label: 'Other medications or recreational drugs?', hint: 'Optional', placeholder: 'e.g., None', optional: true },
      { key: 'lifestyle_other_health_changes', label: 'Other health changes you want to remember to mention?', hint: 'Optional — e.g., fatigue, fever, unexplained weight loss you’ve noticed', placeholder: 'e.g., No other changes, or recent fatigue 2 weeks', optional: true },
      { key: 'bring_what_to_bring', label: 'What will you bring to the visit?', hint: 'Practical checklist — helps you prepare', placeholder: 'e.g., ID, insurance, medication list, previous mammogram report (2024), implant card, this summary printed' },
    ],
  },
];

export default function VisitReadiness() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [include, setInclude] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ lump_history: true });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<Stored[]>('/api/visit-readiness');
      const ans: Record<string, string> = {};
      const inc: Record<string, boolean> = {};
      for (const r of data) {
        ans[r.question_key] = r.answer;
        inc[r.question_key] = r.include_in_summary !== false;
      }
      setAnswers(ans);
      setInclude(inc);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const setAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInclude = (key: string) => {
    setInclude((prev) => ({ ...prev, [key]: !(prev[key] !== false) }));
  };

  const saveAll = async () => {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const items = Object.entries(answers)
        .filter(([, v]) => v.trim().length > 0)
        .map(([k, v]) => ({
          question_key: k,
          answer: v.trim(),
          include_in_summary: include[k] !== false,
        }));
      if (items.length === 0) {
        setMsg('Nothing to save yet — add answers first.');
        setSaving(false);
        return;
      }
      await apiSend('/api/visit-readiness', 'POST', { items });
      setMsg(`Saved ${items.length} answer${items.length === 1 ? '' : 's'} privately. Included answers will appear in your Health Summary.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const clearSection = async (section: Section) => {
    if (!confirm(`Clear all answers in "${section.title}"?`)) return;
    try {
      for (const q of section.questions) {
        if (answers[q.key]) {
          await apiSend('/api/visit-readiness', 'DELETE', { question_key: q.key });
        }
      }
      const copy = { ...answers };
      for (const q of section.questions) delete copy[q.key];
      setAnswers(copy);
      setMsg(`Cleared ${section.title}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Clear failed');
    }
  };

  if (loading) return <LoadingSpinner label="Opening your visit prep…" />;

  const totalQuestions = SECTIONS.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.values(answers).filter((v) => v.trim().length > 0).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Visit Readiness"
        subtitle="Prepare accurate answers in advance — so you don't have to recall everything on the spot. This is a memory aid, not a medical assessment. No scores are generated."
        action={
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </button>
        }
      />

      <div className="rounded-xl border border-forest/20 bg-forest/5 p-4 flex gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div className="text-sm text-charcoal/75 leading-relaxed">
          <p className="font-medium text-charcoal">Why this helps</p>
          <p className="mt-1">
            Clinicians often ask these questions to understand timeline, context, and family background. Writing answers calmly at home helps you give accurate, consistent information during a short visit. This does not diagnose, triage, or replace professional evaluation.
          </p>
          <p className="mt-2 text-xs text-charcoal/55">
            Sources: MedlinePlus — Talking With Your Doctor; NCI — Questions to Ask Your Doctor; CDC — Breast Cancer. Content here is general information, not personal medical advice.
          </p>
        </div>
      </div>

      <Disclaimer />

      <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-charcoal">Progress — {answeredCount} of {totalQuestions} answered</p>
          <p className="text-xs text-charcoal/50">{progress}%</p>
        </div>
        <div className="w-full h-2 rounded-full bg-ivory-deep overflow-hidden">
          <div className="h-full bg-forest transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-charcoal/50 mt-2">All fields optional. Include only what you are comfortable storing. You can export or delete this data anytime in Settings.</p>
      </div>

      {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}
      {msg && <p className="text-sm text-forest bg-forest/8 border border-forest/20 rounded-xl px-4 py-3 flex items-center gap-2"><Check className="w-4 h-4" /> {msg}</p>}

      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const isOpen = openSections[section.id] ?? false;
          const sectionAnswered = section.questions.filter((q) => answers[q.key]?.trim()).length;
          return (
            <section key={section.id} className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden">
              <button
                type="button"
                className="w-full text-left p-5 flex items-start justify-between gap-3 hover:bg-ivory/50 transition-colors"
                onClick={() => setOpenSections((prev) => ({ ...prev, [section.id]: !isOpen }))}
              >
                <div>
                  <h2 className="font-display text-lg text-charcoal flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-forest" />
                    {section.title}
                    <span className="text-xs font-sans font-medium text-charcoal/50">({sectionAnswered}/{section.questions.length})</span>
                  </h2>
                  <p className="text-xs text-charcoal/60 mt-1 leading-relaxed max-w-2xl">{section.desc}</p>
                </div>
                <span className="text-charcoal/30 text-xl">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-5 border-t border-border/60 pt-4">
                  {section.questions.map((q) => (
                    <div key={q.key} className="space-y-1.5">
                      <label htmlFor={q.key} className="block text-sm font-medium text-charcoal">
                        {q.label} {q.optional && <span className="text-charcoal/45 font-normal">(optional)</span>}
                      </label>
                      <p className="text-xs text-charcoal/50">{q.hint}</p>
                      <textarea
                        id={q.key}
                        rows={2}
                        className="input-field resize-y min-h-[56px]"
                        value={answers[q.key] || ''}
                        onChange={(e) => setAnswer(q.key, e.target.value)}
                        placeholder={q.placeholder}
                      />
                      <label className="flex items-center gap-2 text-xs text-charcoal/60 mt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={include[q.key] !== false}
                          onChange={() => toggleInclude(q.key)}
                        />
                        Include in Health Summary
                      </label>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <button type="button" className="btn-ghost text-xs" onClick={() => clearSection(section)}>
                      Clear section
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" disabled={saving} onClick={saveAll}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : `Save all answers (${answeredCount})`}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const all: Record<string, boolean> = {};
            for (const s of SECTIONS) for (const q of s.questions) all[q.key] = false;
            setOpenSections(all);
          }}
        >
          Collapse all
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const all: Record<string, boolean> = {};
            for (const s of SECTIONS) for (const q of s.questions) all[q.key] = true;
            setOpenSections(all);
          }}
        >
          Expand all
        </button>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 text-xs text-charcoal/70 leading-relaxed">
        <p className="font-medium text-charcoal">Important notes</p>
        <ul className="list-disc pl-4 mt-2 space-y-1">
          <li>This is a personal organizer, not a medical assessment. It does not tell you what your symptoms mean.</li>
          <li>Family history is context for your clinician, not a risk score calculated by the app.</li>
          <li>If you notice fever with red, painful breast, rapidly spreading redness, or feel acutely unwell, seek same-day or urgent care — do not wait for a routine visit.</li>
          <li>Bring official reports, medication list, ID, and insurance to your appointment along with this summary if you choose.</li>
        </ul>
      </div>
    </div>
  );
}
