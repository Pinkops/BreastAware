import { useEffect, useState, useRef } from 'react';
import { MapPin, Trash2, Info } from 'lucide-react';
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
  created_at?: string;
}

export default function BodyMap() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [label, setLabel] = useState('Noted area');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
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
    load();
  }, []);

  const onMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPending({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  };

  const saveMarker = async () => {
    if (!pending) return;
    setSaving(true);
    setError('');
    try {
      await apiSend('/api/body-map', 'POST', {
        x_pct: pending.x,
        y_pct: pending.y,
        side: 'front',
        label: label || 'Noted area',
        notes,
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
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Body Map"
        subtitle="Tap the diagram to place markers for personal documentation only. This map does not analyze, diagnose, or interpret findings."
      />

      <div className="rounded-xl border border-border bg-white/80 p-4 flex gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-charcoal/70 leading-relaxed">
          <strong className="text-charcoal">Documentation only.</strong> Markers help you remember where you noticed something
          so you can describe it to a healthcare professional. Placement is approximate and not a clinical diagram.
        </p>
      </div>

      <Disclaimer compact />

      {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div
            ref={mapRef}
            onClick={onMapClick}
            role="img"
            aria-label="Front chest body map. Click to place a marker."
            className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl border-2 border-dashed border-forest/25 bg-gradient-to-b from-white to-ivory cursor-crosshair shadow-soft overflow-hidden select-none"
          >
            {/* Simple anatomical silhouette */}
            <svg viewBox="0 0 200 280" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
              {/* neck */}
              <ellipse cx="100" cy="28" rx="18" ry="14" fill="none" stroke="#2F4F3E" strokeWidth="1.5" opacity="0.35" />
              {/* shoulders */}
              <path d="M40 50 Q100 40 160 50 L155 70 Q100 58 45 70 Z" fill="#2F4F3E" fillOpacity="0.06" stroke="#2F4F3E" strokeWidth="1.25" opacity="0.5" />
              {/* torso */}
              <path d="M45 70 Q40 140 50 220 L150 220 Q160 140 155 70 Q100 58 45 70" fill="#2F4F3E" fillOpacity="0.04" stroke="#2F4F3E" strokeWidth="1.25" opacity="0.45" />
              {/* left breast oval */}
              <ellipse cx="78" cy="105" rx="28" ry="32" fill="#C4787A" fillOpacity="0.08" stroke="#C4787A" strokeWidth="1.2" opacity="0.55" />
              <circle cx="78" cy="108" r="4" fill="#C4787A" fillOpacity="0.25" />
              {/* right breast oval */}
              <ellipse cx="122" cy="105" rx="28" ry="32" fill="#C4787A" fillOpacity="0.08" stroke="#C4787A" strokeWidth="1.2" opacity="0.55" />
              <circle cx="122" cy="108" r="4" fill="#C4787A" fillOpacity="0.25" />
              {/* midline */}
              <line x1="100" y1="55" x2="100" y2="200" stroke="#2F4F3E" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.25" />
              <text x="55" y="155" fontSize="8" fill="#2F4F3E" opacity="0.4">L</text>
              <text x="138" y="155" fontSize="8" fill="#2F4F3E" opacity="0.4">R</text>
            </svg>

            {markers.map((m) => (
              <button
                key={m.id}
                type="button"
                className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-coral border-2 border-white shadow-md hover:scale-125 transition-transform z-10"
                style={{ left: `${m.x_pct}%`, top: `${m.y_pct}%` }}
                title={m.label}
                aria-label={m.label}
                onClick={(e) => e.stopPropagation()}
              />
            ))}

            {pending && (
              <div
                className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-forest border-2 border-white shadow-lg animate-pulse z-20"
                style={{ left: `${pending.x}%`, top: `${pending.y}%` }}
              />
            )}

            <p className="absolute bottom-3 inset-x-0 text-center text-[11px] text-charcoal/40 pointer-events-none">
              Tap to place a marker
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {pending && (
            <div className="rounded-2xl border border-forest/30 bg-white p-5 shadow-soft space-y-3">
              <h3 className="font-display text-lg text-charcoal">New marker</h3>
              <p className="text-xs text-charcoal/50">Position: {pending.x}%, {pending.y}%</p>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="m-label">Label</label>
                <input id="m-label" className="input-field" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="m-notes">Notes</label>
                <textarea id="m-notes" rows={3} className="input-field resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional description…" />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-primary" disabled={saving} onClick={saveMarker}>
                  {saving ? 'Saving…' : 'Save marker'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setPending(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg text-charcoal mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-forest" />
              Saved markers ({markers.length})
            </h3>
            {markers.length === 0 ? (
              <p className="text-sm text-charcoal/55">No markers yet. Tap the diagram to document an area.</p>
            ) : (
              <ul className="space-y-3">
                {markers.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{m.label}</p>
                      {m.notes && <p className="text-xs text-charcoal/60 mt-0.5">{m.notes}</p>}
                      <p className="text-[11px] text-charcoal/40 mt-1">{formatDateTime(m.created_at)}</p>
                    </div>
                    <button type="button" className="text-charcoal/35 hover:text-rose-deep p-1" aria-label="Delete" onClick={() => remove(m.id)}>
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
