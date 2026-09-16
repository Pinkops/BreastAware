import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle } from 'lucide-react';
import { apiSend } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Disclaimer from '../components/Disclaimer';

const CHANGE_TYPES = [
  { value: 'lump_or_thickening', label: 'Lump or thickening' },
  { value: 'skin_change', label: 'Skin change (dimpling, redness, texture)' },
  { value: 'nipple_change', label: 'Nipple change' },
  { value: 'discharge', label: 'Nipple discharge' },
  { value: 'pain_or_tenderness', label: 'Pain or tenderness' },
  { value: 'swelling', label: 'Swelling or size change' },
  { value: 'shape_change', label: 'Shape or contour change' },
  { value: 'other', label: 'Other / not sure how to describe' },
];

const SYMPTOMS = [
  'Warmth',
  'Redness',
  'Itching',
  'Pulling sensation',
  'Underarm change',
  'Visible vein change',
  'None of these',
];

export default function LogChange() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [changeType, setChangeType] = useState('');
  const [side, setSide] = useState('not_specified');
  const [observedAt, setObservedAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [locationDesc, setLocationDesc] = useState('');
  const [sizeDesc, setSizeDesc] = useState('');
  const [texture, setTexture] = useState('');
  const [pain, setPain] = useState<number | ''>('');
  const [duration, setDuration] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [discussed, setDiscussed] = useState(false);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!changeType) {
      setError('Please choose what kind of change you noticed.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiSend('/api/observations', 'POST', {
        change_type: changeType,
        side,
        observed_at: new Date(observedAt).toISOString(),
        location_description: locationDesc,
        size_description: sizeDesc,
        texture,
        pain_level: pain === '' ? null : pain,
        duration,
        associated_symptoms: symptoms,
        notes,
        discussed_with_provider: discussed,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="rounded-2xl border border-border bg-white shadow-soft p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
            <Save className="w-6 h-6 text-forest" />
          </div>
          <h1 className="font-display text-2xl text-charcoal mb-2">Observation saved</h1>
          <p className="text-sm text-charcoal/70 leading-relaxed mb-4">
            Your note is timestamped in your private journal. Saving a change does not mean it is or is not serious —
            only a healthcare professional can evaluate what you noticed.
          </p>
          <div className="rounded-xl bg-ivory border border-border p-4 text-left text-sm text-charcoal/75 leading-relaxed mb-6">
            <p className="font-medium text-charcoal mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-coral" />
              Next step
            </p>
            If this change is new, persistent, or worries you, schedule a conversation with a healthcare professional.
            You can add questions in Doctor Prep and mark the area on the Body Map for personal documentation.
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" className="btn-primary" onClick={() => navigate('/journal')}>View journal</button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/body-map')}>Mark on body map</button>
            <button type="button" className="btn-ghost" onClick={() => navigate('/doctor-prep')}>Doctor prep</button>
          </div>
        </div>
        <Disclaimer compact />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log a Change"
        subtitle="Record what you personally noticed. Clear details help you describe the change to a clinician later."
      />
      <Disclaimer />

      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="change-type">What did you notice?</label>
            <select
              id="change-type"
              className="input-field"
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {CHANGE_TYPES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-semibold mb-2">Which side?</span>
            <div className="flex flex-wrap gap-2">
              {['left', 'right', 'both', 'not_specified'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    side === s ? 'bg-forest text-ivory border-forest' : 'bg-white border-border text-charcoal/70 hover:border-forest/40'
                  }`}
                >
                  {s === 'not_specified' ? 'Not specified' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="observed-at">When did you first notice it?</label>
            <input
              id="observed-at"
              type="datetime-local"
              className="input-field"
              value={observedAt}
              onChange={(e) => setObservedAt(e.target.value)}
              required
            />
            <p className="text-xs text-charcoal/45 mt-1">Timestamped automatically when you save; you can adjust this field.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-4">
          <h3 className="font-display text-lg text-charcoal">Details</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="loc">Where on the breast / chest?</label>
            <input id="loc" className="input-field" value={locationDesc} onChange={(e) => setLocationDesc(e.target.value)} placeholder="e.g., upper outer left, near nipple" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="size">Size (your words)</label>
              <input id="size" className="input-field" value={sizeDesc} onChange={(e) => setSizeDesc(e.target.value)} placeholder="e.g., pea-sized, quarter-sized" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="texture">Texture / feel</label>
              <input id="texture" className="input-field" value={texture} onChange={(e) => setTexture(e.target.value)} placeholder="e.g., firm, soft, movable" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="pain">Discomfort (0–10, optional)</label>
              <input
                id="pain"
                type="number"
                min={0}
                max={10}
                className="input-field"
                value={pain}
                onChange={(e) => setPain(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="duration">How long has it been present?</label>
              <input id="duration" className="input-field" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 3 days, since last month" />
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium mb-2">Anything else nearby?</span>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    symptoms.includes(s) ? 'bg-coral/15 border-coral text-charcoal' : 'border-border text-charcoal/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="notes">Free notes</label>
            <textarea id="notes" rows={4} className="input-field resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else you want to remember…" />
          </div>
          <label className="flex items-start gap-2.5 text-sm text-charcoal/75 cursor-pointer">
            <input type="checkbox" className="mt-1 rounded border-border" checked={discussed} onChange={(e) => setDiscussed(e.target.checked)} />
            I have already discussed this with a healthcare professional
          </label>
        </div>

        {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}

        <button type="submit" className="btn-primary" disabled={busy}>
          <Save className="w-4 h-4" />
          {busy ? 'Saving…' : 'Save observation'}
        </button>
      </form>
    </div>
  );
}
