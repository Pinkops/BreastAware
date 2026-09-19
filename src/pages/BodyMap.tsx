import { useEffect, useState, useRef, useMemo } from 'react';
import { MapPin, Trash2, Info, Eye, Grid3x3, Clock3, Move } from 'lucide-react';
import { apiGet, apiSend, formatDateTime } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

interface Marker {
  id: number;
  side: string;
  x_pct: number;
  y_pct: number;
  label: string;
  notes?: string;
  quadrant?: string;
  clock_position?: string;
  created_at?: string;
}

type Pending = {
  x: number;
  y: number;
  side: string;
  quadrant: string;
  clock: string;
};

const LEFT_CENTER = { x: 35, y: 32 };
const RIGHT_CENTER = { x: 65, y: 32 };
const LEFT_NIPPLE = { x: 35, y: 34 };
const RIGHT_NIPPLE = { x: 65, y: 34 };

function detectSide(x: number): string {
  if (x < 47) return 'left';
  if (x > 53) return 'right';
  return 'center';
}

function detectQuadrant(x: number, y: number): string {
  const isLeft = x < 50;
  const center = isLeft ? LEFT_CENTER : RIGHT_CENTER;
  const dx = x - center.x;
  const dy = y - center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 22) {
    if (y < 18) return 'collarbone area';
    if (isLeft && x < 18 && y < 40) return 'left axilla';
    if (!isLeft && x > 82 && y < 40) return 'right axilla';
    if (y > 55) return 'lower chest';
    return 'chest wall';
  }
  const upper = dy < -1;
  const outer = isLeft ? dx < 0 : dx > 0;
  if (upper && outer) return 'upper outer';
  if (upper && !outer) return 'upper inner';
  if (!upper && outer) return 'lower outer';
  return 'lower inner';
}

function detectClock(x: number, y: number): string {
  const isLeft = x < 50;
  const nipple = isLeft ? LEFT_NIPPLE : RIGHT_NIPPLE;
  const dx = x - nipple.x;
  const dy = y - nipple.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2) return 'at nipple';
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  let clock = Math.round(((angle + 90) / 30) % 12);
  if (clock <= 0) clock += 12;
  if (clock > 12) clock -= 12;
  return `${clock} o'clock`;
}

export default function BodyMap() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [label, setLabel] = useState('Noted area');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const [showQuadrants, setShowQuadrants] = useState(true);
  const [showClock, setShowClock] = useState(true);
  const [filterSide, setFilterSide] = useState<'all' | 'left' | 'right'>('all');
  const mapRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await apiGet<Marker[]>('/api/body-map');
      setMarkers(data);
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

  const createPending = (x: number, y: number) => {
    const side = detectSide(x);
    const quadrant = detectQuadrant(x, y);
    const clock = detectClock(x, y);
    setPending({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, side, quadrant, clock });
  };

  const onMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    createPending(x, y);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!pending) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        createPending(LEFT_CENTER.x, LEFT_CENTER.y);
      }
      return;
    }
    let { x, y } = pending;
    const step = e.shiftKey ? 3 : 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); x = Math.max(0, x - step); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); x = Math.min(100, x + step); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); y = Math.max(0, y - step); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); y = Math.min(100, y + step); }
    else if (e.key === 'Escape') { e.preventDefault(); setPending(null); return; }
    else if (e.key === 'Enter') { e.preventDefault(); void saveMarker(); return; }
    else return;
    createPending(x, y);
  };

  const saveMarker = async () => {
    if (!pending) return;
    setSaving(true);
    setError('');
    try {
      const fullNotes = notes.trim()
        ? `${notes.trim()} | ${pending.quadrant}, ${pending.clock}, side: ${pending.side}`
        : `${pending.quadrant}, ${pending.clock}, side: ${pending.side}`;
      await apiSend('/api/body-map', 'POST', {
        x_pct: pending.x,
        y_pct: pending.y,
        side: pending.side,
        label: label.trim() || 'Noted area',
        notes: fullNotes,
        quadrant: pending.quadrant,
        clock_position: pending.clock,
      });
      setPending(null);
      setNotes('');
      setLabel('Noted area');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Remove this marker?')) return;
    try {
      await apiSend('/api/body-map', 'DELETE', { id });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = useMemo(() => {
    if (filterSide === 'all') return markers;
    return markers.filter((m) => m.side === filterSide || (m.x_pct < 50 && filterSide === 'left') || (m.x_pct >= 50 && filterSide === 'right'));
  }, [markers, filterSide]);

  if (loading) return <LoadingSpinner label="Loading your body map…" />;

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Body Map"
        subtitle="Premium documentation map — tap to mark where you noticed something. This is a personal memory aid, not a clinical diagram, diagnosis, or measurement tool."
      />

      <div className="rounded-xl border border-forest/20 bg-forest/5 p-4 flex gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div className="text-sm text-charcoal/75 leading-relaxed">
          <p className="font-medium text-charcoal">How to use this premium map</p>
          <p className="mt-1">
            The illustration shows a front torso with both breasts, nipple/areola landmarks, axilla (armpit) and collarbone areas.
            Tap/click to place a marker. The app auto-detects side, quadrant (upper outer, etc.) and clock position (e.g., 2 o'clock) to help you describe location to a clinician.
            Use keyboard: Tab to map, Enter to place, arrow keys to move, Enter to save, Esc to cancel.
          </p>
          <p className="mt-2 text-xs text-charcoal/55">
            Markers are approximate. No measurements, volumes, or diagnoses are calculated. For personal notes only.
          </p>
        </div>
      </div>

      <Disclaimer compact />

      {error && <p className="text-sm text-rose-deep bg-rose-soft/30 border border-rose/20 rounded-xl px-4 py-3" role="alert">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowQuadrants((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${showQuadrants ? 'bg-forest text-white border-forest' : 'bg-white text-charcoal/60 border-border'}`}
        >
          <Grid3x3 className="w-3.5 h-3.5" /> {showQuadrants ? 'Quadrants on' : 'Quadrants off'}
        </button>
        <button
          type="button"
          onClick={() => setShowClock((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${showClock ? 'bg-forest text-white border-forest' : 'bg-white text-charcoal/60 border-border'}`}
        >
          <Clock3 className="w-3.5 h-3.5" /> {showClock ? 'Clock on' : 'Clock off'}
        </button>
        <div className="inline-flex items-center gap-1 text-xs bg-white border border-border rounded-full p-1">
          <button type="button" onClick={() => setFilterSide('all')} className={`px-2.5 py-1 rounded-full ${filterSide === 'all' ? 'bg-ivory-deep font-medium' : 'text-charcoal/50'}`}>All</button>
          <button type="button" onClick={() => setFilterSide('left')} className={`px-2.5 py-1 rounded-full ${filterSide === 'left' ? 'bg-ivory-deep font-medium' : 'text-charcoal/50'}`}>Left</button>
          <button type="button" onClick={() => setFilterSide('right')} className={`px-2.5 py-1 rounded-full ${filterSide === 'right' ? 'bg-ivory-deep font-medium' : 'text-charcoal/50'}`}>Right</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        <div className="space-y-3">
          <div
            ref={mapRef}
            onClick={onMapClick}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="application"
            aria-label="Premium front torso body map. Click or press Enter to place a marker. Use arrow keys to move pending marker."
            className="relative w-full max-w-[480px] mx-auto aspect-[4/5.5] rounded-[28px] border border-border bg-white shadow-soft overflow-hidden select-none focus:outline-none focus:ring-2 focus:ring-forest/30 cursor-crosshair"
          >
            <svg viewBox="0 0 400 560" className="absolute inset-0 w-full h-full" aria-hidden>
              <defs>
                <radialGradient id="skin" cx="50%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="#FFF7F0" />
                  <stop offset="45%" stopColor="#F6DDD0" />
                  <stop offset="100%" stopColor="#E8C4B0" stopOpacity="0.9" />
                </radialGradient>
                <radialGradient id="breastGrad" cx="50%" cy="40%" r="65%">
                  <stop offset="0%" stopColor="#F9E6DC" />
                  <stop offset="55%" stopColor="#EACFC1" />
                  <stop offset="100%" stopColor="#DAB8A6" stopOpacity="0.95" />
                </radialGradient>
                <radialGradient id="areolaGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#D9A99A" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#B87E6A" stopOpacity="0.55" />
                </radialGradient>
                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#2F4F3E" floodOpacity="0.12" />
                </filter>
              </defs>

              <path
                d="M 95 58 
                   C 110 48, 150 42, 200 42 
                   C 250 42, 290 48, 305 58
                   L 312 125
                   C 318 210, 310 340, 298 445
                   L 102 445
                   C 90 340, 82 210, 88 125 Z"
                fill="url(#skin)"
                stroke="#2F4F3E"
                strokeWidth="1.2"
                strokeOpacity="0.18"
                filter="url(#softShadow)"
              />

              <ellipse cx="200" cy="38" rx="34" ry="22" fill="#FFF7F0" stroke="#2F4F3E" strokeWidth="1" strokeOpacity="0.15" />
              <path d="M 125 68 Q 160 62 200 65 Q 240 62 275 68" fill="none" stroke="#2F4F3E" strokeWidth="0.8" strokeOpacity="0.22" strokeLinecap="round" />
              <text x="200" y="58" textAnchor="middle" fontSize="7.5" fill="#2F4F3E" opacity="0.35" letterSpacing="0.3">collarbone</text>

              <g>
                <path
                  d="M 78 132
                     C 78 108, 105 98, 140 112
                     C 175 125, 190 155, 178 185
                     C 168 210, 135 225, 105 215
                     C 82 207, 68 182, 78 132 Z"
                  fill="url(#breastGrad)"
                  stroke="#C4787A"
                  strokeWidth="1.1"
                  strokeOpacity="0.35"
                />
                <ellipse cx="140" cy="168" rx="20" ry="19" fill="url(#areolaGrad)" opacity="0.95" />
                <circle cx="140" cy="170" r="5.5" fill="#8B5A3C" opacity="0.9" />
                <circle cx="140" cy="170" r="2" fill="#5A3328" opacity="0.8" />
              </g>

              <g>
                <path
                  d="M 322 132
                     C 322 108, 295 98, 260 112
                     C 225 125, 210 155, 222 185
                     C 232 210, 265 225, 295 215
                     C 318 207, 332 182, 322 132 Z"
                  fill="url(#breastGrad)"
                  stroke="#C4787A"
                  strokeWidth="1.1"
                  strokeOpacity="0.35"
                />
                <ellipse cx="260" cy="168" rx="20" ry="19" fill="url(#areolaGrad)" opacity="0.95" />
                <circle cx="260" cy="170" r="5.5" fill="#8B5A3C" opacity="0.9" />
                <circle cx="260" cy="170" r="2" fill="#5A3328" opacity="0.8" />
              </g>

              <path d="M 200 85 L 200 230" stroke="#2F4F3E" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.18" />
              <path d="M 88 125 Q 68 135 62 155" fill="none" stroke="#2F4F3E" strokeWidth="0.7" strokeOpacity="0.18" strokeLinecap="round" />
              <path d="M 312 125 Q 332 135 338 155" fill="none" stroke="#2F4F3E" strokeWidth="0.7" strokeOpacity="0.18" strokeLinecap="round" />
              <text x="52" y="145" fontSize="7" fill="#2F4F3E" opacity="0.32" textAnchor="middle">axilla</text>
              <text x="348" y="145" fontSize="7" fill="#2F4F3E" opacity="0.32" textAnchor="middle">axilla</text>

              {showQuadrants && (
                <g opacity="0.28">
                  <line x1="78" y1="168" x2="190" y2="168" stroke="#2F4F3E" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="140" y1="110" x2="140" y2="225" stroke="#2F4F3E" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="210" y1="168" x2="322" y2="168" stroke="#2F4F3E" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="260" y1="110" x2="260" y2="225" stroke="#2F4F3E" strokeWidth="0.5" strokeDasharray="3 3" />
                </g>
              )}

              {showClock && (
                <g fontSize="8" fill="#2F4F3E" opacity="0.38" fontWeight="600">
                  <text x="140" y="104" textAnchor="middle">12</text>
                  <text x="188" y="172" textAnchor="start">3</text>
                  <text x="140" y="232" textAnchor="middle">6</text>
                  <text x="72" y="172" textAnchor="end">9</text>
                  <text x="260" y="104" textAnchor="middle">12</text>
                  <text x="328" y="172" textAnchor="start">3</text>
                  <text x="260" y="232" textAnchor="middle">6</text>
                  <text x="212" y="172" textAnchor="end">9</text>
                </g>
              )}

              <g>
                <rect x="98" y="248" width="32" height="14" rx="7" fill="#2F4F3E" opacity="0.9" />
                <text x="114" y="257.5" textAnchor="middle" fontSize="8" fill="white" fontWeight="600" letterSpacing="0.5">L</text>
                <rect x="270" y="248" width="32" height="14" rx="7" fill="#2F4F3E" opacity="0.9" />
                <text x="286" y="257.5" textAnchor="middle" fontSize="8" fill="white" fontWeight="600" letterSpacing="0.5">R</text>
              </g>

              <path d="M 102 228 Q 200 242 298 228" fill="none" stroke="#2F4F3E" strokeWidth="0.6" opacity="0.15" />
            </svg>

            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                className="absolute -ml-3 -mt-3 w-6 h-6 rounded-full bg-coral border-2 border-white shadow-lg hover:scale-110 transition-transform z-10 flex items-center justify-center group"
                style={{ left: `${m.x_pct}%`, top: `${m.y_pct}%` }}
                title={`${m.label} — ${m.quadrant || ''} ${m.clock_position || ''}`.trim()}
                aria-label={`${m.label} at ${m.x_pct}%, ${m.y_pct}%`}
                onClick={(e) => { e.stopPropagation(); }}
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-charcoal text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-20">
                  {m.label}
                </span>
              </button>
            ))}

            {pending && (
              <div
                className="absolute -ml-4 -mt-4 w-8 h-8 rounded-full bg-forest border-2 border-white shadow-xl z-20 flex items-center justify-center animate-pulse"
                style={{ left: `${pending.x}%`, top: `${pending.y}%` }}
              >
                <Move className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2 pointer-events-none">
              <span className="text-[10px] bg-white/90 border border-border rounded-full px-2.5 py-1 text-charcoal/50 shadow-sm">
                Tap to place • Arrow keys to move • Enter to save
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 flex gap-2 max-w-[480px] mx-auto">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-charcoal/70 leading-relaxed">
              <span className="font-medium text-charcoal">Premium map:</span> Left is your left, Right is your right (as if looking in a mirror).
              Quadrants: upper outer / upper inner / lower outer / lower inner. Clock: 12 o'clock is top, 3 o'clock is outer.
              Markers help you remember location for clinician conversations — not measurements.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {pending ? (
            <div className="rounded-2xl border-2 border-forest/30 bg-white p-5 shadow-soft space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg text-charcoal">New marker — premium details</h3>
                  <p className="text-xs text-charcoal/50 mt-1">
                    {pending.side.toUpperCase()} • {pending.quadrant} • {pending.clock} • {pending.x}%, {pending.y}%
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] bg-forest/10 text-forest px-2 py-1 rounded-full">
                  <MapPin className="w-3 h-3" /> {pending.side}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-ivory p-2.5 border border-border/60">
                  <p className="text-charcoal/45 uppercase tracking-wide">Side</p>
                  <p className="font-medium text-charcoal mt-0.5 capitalize">{pending.side}</p>
                </div>
                <div className="rounded-xl bg-ivory p-2.5 border border-border/60">
                  <p className="text-charcoal/45 uppercase tracking-wide">Quadrant</p>
                  <p className="font-medium text-charcoal mt-0.5 capitalize">{pending.quadrant}</p>
                </div>
                <div className="rounded-xl bg-ivory p-2.5 border border-border/60">
                  <p className="text-charcoal/45 uppercase tracking-wide">Clock</p>
                  <p className="font-medium text-charcoal mt-0.5">{pending.clock}</p>
                </div>
                <div className="rounded-xl bg-ivory p-2.5 border border-border/60">
                  <p className="text-charcoal/45 uppercase tracking-wide">Position</p>
                  <p className="font-medium text-charcoal mt-0.5">{pending.x}%, {pending.y}%</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="m-label">Label <span className="text-charcoal/40 font-normal">(e.g., tender spot, lump, skin change)</span></label>
                <input id="m-label" className="input-field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., Tender spot upper outer left" maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="m-notes">Notes <span className="text-charcoal/40 font-normal">(optional, helps clinician)</span></label>
                <textarea id="m-notes" rows={3} className="input-field resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Pea-sized, tender when pressed, noticed 2 weeks ago..." maxLength={2000} />
                <p className="text-[11px] text-charcoal/40 mt-1">Auto-details (quadrant/clock/side) will be added to notes for your Health Summary.</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn-primary flex-1" disabled={saving} onClick={saveMarker}>
                  {saving ? 'Saving…' : `Save marker — ${pending.quadrant}`}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setPending(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-forest/20 bg-forest/5 p-5 text-center">
              <MapPin className="w-6 h-6 text-forest/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-charcoal">No pending marker</p>
              <p className="text-xs text-charcoal/55 mt-1 max-w-sm mx-auto leading-relaxed">
                Tap the premium torso illustration to place a marker. The app will auto-detect side, quadrant, and clock position to make your notes precise.
              </p>
              <p className="text-[11px] text-charcoal/40 mt-3 flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" /> Keyboard: Tab → Enter → arrows → Enter
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg text-charcoal mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-forest" />
              Saved markers ({filtered.length} of {markers.length})
              {filterSide !== 'all' && <span className="text-xs font-sans text-charcoal/40">— {filterSide} filtered</span>}
            </h3>
            {markers.length === 0 ? (
              <p className="text-sm text-charcoal/55">No markers yet. Tap the diagram to document an area.</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-charcoal/55">No {filterSide} markers. Switch filter to All.</p>
            ) : (
              <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filtered.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0 group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${m.side === 'left' || m.x_pct < 50 ? 'bg-coral' : 'bg-forest'}`} />
                        {m.label}
                      </p>
                      <p className="text-[11px] text-charcoal/50 mt-1">
                        {m.quadrant || detectQuadrant(m.x_pct, m.y_pct)} • {m.clock_position || detectClock(m.x_pct, m.y_pct)} • {m.side || (m.x_pct < 50 ? 'left' : 'right')} • {m.x_pct}%, {m.y_pct}%
                      </p>
                      {m.notes && <p className="text-xs text-charcoal/70 mt-1 line-clamp-3">{m.notes}</p>}
                      <p className="text-[11px] text-charcoal/35 mt-1">{formatDateTime(m.created_at)}</p>
                    </div>
                    <button type="button" className="text-charcoal/25 hover:text-rose-deep p-1.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete marker" onClick={() => remove(m.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
