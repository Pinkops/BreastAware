import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle, MapPin, ClipboardList, BookOpen, Eye } from 'lucide-react';
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
  const [lastSaved, setLastSaved] = useState<{ type: string; side: string } | null>(null);

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
      setLastSaved({ type: changeType, side });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        <div className="rounded-2xl border border-forest/20 bg-white shadow-soft p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
            <Save className="w-6 h-6 text-forest" />
          </div>
          <h1 className="font-display text-2xl text-charcoal mb-2">Observation saved to your private journal</h1>
          <p className="text-sm text-charcoal/70 leading-relaxed mb-1">
            {lastSaved ? `${lastSaved.type.replace(/_/g, ' ')} ${lastSaved.side !== 'not_specified' ? `· ${lastSaved.side}` : ''}` : 'Saved'} — timestamped privately. Only you can see it.
          </p>
          <p className="text-xs text-charcoal/50 mb-6">Saving does not mean it is or is not serious — only a clinician can evaluate what you noticed.</p>

          <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-4 text-left text-sm text-charcoal/75 leading-relaxed mb-6">
            <p className="font-medium text-charcoal mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Make this record visit-ready — 2 minute next steps
            </p>
            <ol className="list-decimal list-inside space-y-1 text-charcoal/70 mt-2">
              <li>Mark approximate location on Body Map (optional, helps you describe it)</li>
              <li>Prepare answers clinicians may ask in Visit Readiness</li>
              <li>Review timeline to spot patterns before your appointment</li>
            </ol>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <button type="button" className="rounded-2xl border border-forest bg-forest text-ivory p-4 text-left hover:bg-forest/90 transition-colors" onClick={() => navigate('/body-map')}>
              <MapPin className="w-5 h-5 mb-2" />
              <p className="text-sm font-medium">Mark on Body Map</p>
              <p className="text-xs text-ivory/70 mt-1">Add location dot for this change</p>
            </button>
            <button type="button" className="rounded-2xl border border-border bg-white p-4 text-left hover:border-forest/30 transition-colors" onClick={() => navigate('/visit-readiness')}>
              <ClipboardList className="w-5 h-5 mb-2 text-forest" />
              <p className="text-sm font-medium text-charcoal">Prepare for visit</p>
              <p className="text-xs text-charcoal/50 mt-1">Answer 43 Qs in advance</p>
            </button>
            <button type="button" className="rounded-2xl border border-border bg-white p-4 text-left hover:border-forest/30 transition-colors" onClick={() => navigate('/journal')}>
              <BookOpen className="w-5 h-5 mb-2 text-coral" />
              <p className="text-sm font-medium text-charcoal">View timeline</p>
              <p className="text-xs text-charcoal/50 mt-1">See all observations</p>
            </button>
          </div>

          <button type="button" className="btn-ghost mt-6 text-sm" onClick={() => { setDone(false); setChangeType(''); setNotes(''); setLocationDesc(''); setSizeDesc(''); }}>Log another change</button>
        </div>
        <Disclaimer compact />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Record a Change"
        subtitle="Central record — what you noticed, when, where. Clear details help you describe it to a clinician later. Your notes stay private to you."
      />
      <Disclaimer />

      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="change-type">What did you notice? *</label>
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
            <p className="text-xs text-charcoal/45 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> After saving, you can mark approximate location on Body Map for personal documentation.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="observed-at">When did you first notice it? *</label>
            <input
              id="observed-at"
              type="datetime-local"
              className="input-field"
              value={observedAt}
              onChange={(e) => setObservedAt(e.target.value)}
              required
            />
            <p className="text-xs text-charcoal/45 mt-1">Timestamped when you save; you can adjust.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-4">
          <h3 className="font-display text-lg text-charcoal flex items-center gap-2"><Eye className="w-4 h-4 text-forest" /> Details — your words</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="loc">Where on the breast / chest?</label>
            <input id="loc" className="input-field" value={locationDesc} onChange={(e) => setLocationDesc(e.target.value)} placeholder="e.g., upper outer left, near nipple, under arm" />
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
                placeholder="0 = none, 10 = severe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="duration">How long has it been present?</label>
              <input id="duration" className="input-field" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 3 days, since last period" />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium mb-2">Associated changes (optional)</span>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${symptoms.includes(s) ? 'bg-forest/10 border-forest/30 text-forest' : 'bg-white border-border text-charcoal/60'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="notes">Notes — what else would help you describe this later?</label>
            <textarea id="notes" rows={3} className="input-field resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., noticed after shower, changes with cycle, anything that makes it better/worse" />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={discussed} onChange={(e) => setDiscussed(e.target.checked)} className="mt-0.5" />
            <span className="text-charcoal/70">I have already discussed this with a clinician (for your record-keeping only)</span>
          </label>
        </div>

        {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">
            <Save className="w-4 h-4" />
            {busy ? 'Saving…' : 'Save to private journal'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/journal')}>Cancel</button>
        </div>

        <div className="rounded-xl border border-border bg-ivory/50 p-4 text-xs text-charcoal/60 leading-relaxed">
          <p className="font-medium text-charcoal/80 mb-1">What happens after you save?</p>
          Your observation goes to My Journal (timeline). Next, you can mark location on Body Map, prepare answers for your visit, and generate a Visit Summary packet for your clinician.
        </div>
      </form>
    </div>
  );
}
