import { useEffect, useState, FormEvent } from 'react';
import { Save } from 'lucide-react';
import { apiGet, apiSend } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

interface Baseline {
  look_notes?: string;
  feel_notes?: string;
  size_shape_notes?: string;
  texture_notes?: string;
  nipple_notes?: string;
  cycle_notes?: string;
  asymmetry_notes?: string;
  other_notes?: string;
}

const fields: { key: keyof Baseline; label: string; hint: string }[] = [
  { key: 'look_notes', label: 'Usual look', hint: 'Skin appearance, contour, color you consider normal for you.' },
  { key: 'feel_notes', label: 'Usual feel', hint: 'How your breast tissue typically feels to your touch.' },
  { key: 'size_shape_notes', label: 'Size & shape', hint: 'Shape, fullness, or differences you already know about.' },
  { key: 'texture_notes', label: 'Texture', hint: 'Softness, density, or lumpy areas that are typical for you.' },
  { key: 'nipple_notes', label: 'Nipples & areola', hint: 'Position, inversion that is long-standing, discharge that is usual for you, if any.' },
  { key: 'cycle_notes', label: 'Cycle-related changes', hint: 'Tenderness or fullness tied to your menstrual cycle, if applicable.' },
  { key: 'asymmetry_notes', label: 'Asymmetry', hint: 'Natural left/right differences you have always had.' },
  { key: 'other_notes', label: 'Other personal notes', hint: 'Anything else that helps you recognize “your normal.”' },
];

const teachPoints = [
  {
    title: 'Look',
    text: 'In good light, notice skin texture, contour, dimpling, redness, or swelling compared with what is usual for you.',
  },
  {
    title: 'Feel',
    text: 'With the pads of your fingers, become familiar with the typical feel of your breast tissue, including denser or more textured areas that are normal for you.',
  },
  {
    title: 'Size & shape',
    text: 'Breasts are often slightly different from each other. Knowing your baseline makes new differences easier to describe.',
  },
  {
    title: 'Nipple & areola',
    text: 'Note long-standing inversion, skin changes, or discharge patterns that are already known and stable for you.',
  },
  {
    title: 'Timing',
    text: 'If you menstruate, awareness may be easier at a consistent point in your cycle when breasts are less tender.',
  },
  {
    title: 'When to talk to a clinician',
    text: 'New lumps, skin changes, nipple changes, persistent pain in one area, or anything that feels different from your normal deserve professional evaluation — this app cannot decide significance.',
  },
];

export default function KnowMyNormal() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Baseline>({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<Baseline | null>('/api/normal-baseline');
        if (data) setForm(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await apiSend('/api/normal-baseline', 'PUT', form);
      setMsg('Your baseline notes were saved privately.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Know My Normal"
        subtitle="Breast self-awareness means becoming familiar with the normal look and feel of your breasts so you can recognize changes and discuss them with a healthcare professional."
      />

      <Disclaimer />

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-soft">
        <h2 className="font-display text-xl text-charcoal mb-4">What self-awareness includes</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {teachPoints.map((p) => (
            <div key={p.title} className="rounded-xl bg-ivory border border-border/80 p-4">
              <h3 className="text-sm font-semibold text-forest mb-1.5">{p.title}</h3>
              <p className="text-sm text-charcoal/70 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-charcoal/50 leading-relaxed">
          This information does not diagnose breast cancer or replace clinical breast exams, imaging, or other professional evaluation.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl text-charcoal mb-2">Your personal baseline</h2>
        <p className="text-sm text-charcoal/65 mb-5 leading-relaxed">
          Write what is typical for you. These notes are for your reference and for sharing with a clinician if you choose — not for automated analysis.
        </p>

        <form onSubmit={save} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-soft">
              <label htmlFor={f.key} className="block text-sm font-semibold text-charcoal mb-1">{f.label}</label>
              <p className="text-xs text-charcoal/50 mb-2">{f.hint}</p>
              <textarea
                id={f.key}
                rows={3}
                className="input-field resize-y min-h-[80px]"
                value={form[f.key] || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder="Optional notes…"
              />
            </div>
          ))}

          {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}
          {msg && <p className="text-sm text-forest">{msg}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save my normal'}
          </button>
        </form>
      </section>
    </div>
  );
}
