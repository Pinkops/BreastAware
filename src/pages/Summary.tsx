import { useEffect, useState, useRef, useMemo } from 'react';
import { FileText, Printer, Download, Filter, CheckSquare, Square } from 'lucide-react';
import { apiGet, formatDate, formatDateTime } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

interface SummaryData {
  generated_at: string;
  disclaimer: string;
  profile: { preferred_name?: string; age_range?: string } | null;
  normal_baseline: Record<string, string> | null;
  observations: Array<{
    change_type: string;
    observed_at: string;
    side: string;
    location_description?: string;
    size_description?: string;
    notes?: string;
    duration?: string;
  }>;
  screenings: Array<{
    screening_type: string;
    screening_date: string;
    facility?: string;
    result_summary?: string;
    next_due_date?: string;
  }>;
  appointments: Array<{ title: string; appointment_date: string; provider_name?: string }>;
  risk_notes: Array<{ category: string; description: string }>;
  doctor_prep: Array<{ category: string; content: string; is_priority?: boolean }>;
  body_map_markers: Array<{ label: string; notes?: string; x_pct: number; y_pct: number; quadrant?: string; clock_position?: string }>;
  visit_readiness: Array<{ question_key: string; answer: string }>;
}

type IncludeKeys = 'baseline' | 'observations' | 'screenings' | 'appointments' | 'doctor_prep' | 'risk_notes' | 'body_map' | 'visit_readiness';

export default function Summary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const [include, setInclude] = useState<Record<IncludeKeys, boolean>>({
    baseline: true,
    observations: true,
    screenings: true,
    appointments: true,
    doctor_prep: true,
    risk_notes: true,
    body_map: true,
    visit_readiness: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const s = await apiGet<SummaryData>('/api/summary');
        setData(s);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadJson = () => {
    if (!data) return;
    const filtered = {
      ...data,
      normal_baseline: include.baseline ? data.normal_baseline : null,
      observations: include.observations ? data.observations : [],
      screenings: include.screenings ? data.screenings : [],
      appointments: include.appointments ? data.appointments : [],
      risk_notes: include.risk_notes ? data.risk_notes : [],
      doctor_prep: include.doctor_prep ? data.doctor_prep : [],
      body_map_markers: include.body_map ? data.body_map_markers : [],
      visit_readiness: include.visit_readiness ? data.visit_readiness : [],
    };
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breastaware-visit-summary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggle = (k: IncludeKeys) => setInclude((p) => ({ ...p, [k]: !p[k] }));
  const setAll = (v: boolean) => setInclude({ baseline: v, observations: v, screenings: v, appointments: v, doctor_prep: v, risk_notes: v, body_map: v, visit_readiness: v });

  const selectedCount = useMemo(() => Object.values(include).filter(Boolean).length, [include]);

  if (loading) return <LoadingSpinner label="Building your visit summary…" />;
  if (error) return <p className="text-rose-deep">{error}</p>;
  if (!data) return null;

  const baselineEntries = data.normal_baseline
    ? Object.entries(data.normal_baseline).filter(
        ([k, v]) =>
          !['id', 'user_id', 'created_at', 'updated_at'].includes(k) &&
          typeof v === 'string' &&
          v.trim()
      )
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visit Summary — Selective Packet"
        subtitle={`Choose what to include for your clinician conversation. ${selectedCount} of 8 sections selected. This is not a medical report, diagnosis, or risk assessment.`}
        action={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button type="button" className="btn-primary" onClick={downloadJson}>
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        }
      />

      {/* Selective controls — MOVE 7 hero */}
      <div className="rounded-2xl border border-forest/20 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-forest">
            <Filter className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Select what to include — makes your packet focused and visit-ready</h3>
          </div>
          <div className="flex gap-2">
            <button type="button" className="text-xs px-2.5 py-1 rounded-full border border-border" onClick={() => setAll(true)}>Select all</button>
            <button type="button" className="text-xs px-2.5 py-1 rounded-full border border-border" onClick={() => setAll(false)}>Clear</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {([
            ['baseline', `My normal (${baselineEntries.length})`],
            ['observations', `Observations (${data.observations.length})`],
            ['screenings', `Screening history (${data.screenings.length})`],
            ['appointments', `Appointments (${data.appointments.length})`],
            ['doctor_prep', `My questions (${data.doctor_prep.length})`],
            ['risk_notes', `Health & family history (${data.risk_notes.length})`],
            ['body_map', `Body map markers (${data.body_map_markers.length})`],
            ['visit_readiness', `Prepared answers (${data.visit_readiness.length})`],
          ] as [IncludeKeys, string][]).map(([k, label]) => (
            <button key={k} type="button" onClick={() => toggle(k)} className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border text-sm ${include[k] ? 'bg-forest text-ivory border-forest' : 'bg-white border-border text-charcoal/70'}`}>
              {include[k] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-charcoal/50 mt-3">Tip: For a first visit, include Observations + Prepared Answers + My Questions. For follow-up, include Screening history + Body Map.</p>
      </div>

      <div ref={printRef} className="print-area space-y-5">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-6 h-6 text-forest shrink-0" />
            <div>
              <h2 className="font-display text-xl text-charcoal">BreastAware visit summary</h2>
              <p className="text-xs text-charcoal/50 mt-1">Generated {formatDateTime(data.generated_at)} · {selectedCount} sections</p>
              {data.profile?.preferred_name && (
                <p className="text-sm text-charcoal/70 mt-1">Prepared for: {data.profile.preferred_name}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-charcoal/75 leading-relaxed border-l-2 border-coral/40 pl-3">{data.disclaimer}</p>
        </div>

        {include.baseline && baselineEntries.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg mb-3">My normal (self-described)</h3>
            <dl className="space-y-2">
              {baselineEntries.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wide text-forest/80 font-medium">{k.replace(/_/g, ' ')}</dt>
                  <dd className="text-sm text-charcoal/80 mt-0.5">{v as string}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {include.observations && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg mb-3">Recent observations ({data.observations.length})</h3>
            {data.observations.length === 0 ? (
              <p className="text-sm text-charcoal/55">None recorded.</p>
            ) : (
              <ul className="space-y-3">
                {data.observations.slice(0, 15).map((o, i) => (
                  <li key={i} className="border-b border-border/50 pb-3 last:border-0">
                    <p className="text-sm font-medium capitalize">{o.change_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-charcoal/50">{formatDateTime(o.observed_at)} · {o.side}</p>
                    {o.location_description && <p className="text-sm text-charcoal/70">{o.location_description}</p>}
                    {o.size_description && <p className="text-sm text-charcoal/70">Size: {o.size_description}</p>}
                    {o.duration && <p className="text-sm text-charcoal/70">Duration: {o.duration}</p>}
                    {o.notes && <p className="text-sm text-charcoal/80 mt-1">{o.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {include.screenings && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg mb-3">Screening history</h3>
            {data.screenings.length === 0 ? (
              <p className="text-sm text-charcoal/55">None recorded.</p>
            ) : (
              <ul className="space-y-2">
                {data.screenings.map((s, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium capitalize">{s.screening_type.replace(/_/g, ' ')}</span>
                    {' — '}{formatDate(s.screening_date)}
                    {s.facility ? ` (${s.facility})` : ''}
                    {s.result_summary ? `: ${s.result_summary}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {include.doctor_prep && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg mb-3">Questions & prep for clinician</h3>
            {data.doctor_prep.length === 0 ? (
              <p className="text-sm text-charcoal/55">None marked for summary.</p>
            ) : (
              <ul className="space-y-2">
                {data.doctor_prep.map((p, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    {p.is_priority && <span className="text-coral font-bold">•</span>}
                    <span><span className="text-charcoal/50 capitalize">{p.category}:</span> {p.content}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {include.risk_notes && data.risk_notes.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg mb-3">Health & family history notes</h3>
            <p className="text-xs text-charcoal/50 mb-2">Self-noted topics for conversation — not a risk calculation.</p>
            <ul className="space-y-2">
              {data.risk_notes.map((r, i) => (
                <li key={i} className="text-sm">
                  <span className="capitalize text-forest">{r.category.replace(/_/g, ' ')}:</span> {r.description}
                </li>
              ))}
            </ul>
          </section>
        )}

        {include.body_map && data.body_map_markers.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg mb-3">Body map markers (approximate)</h3>
            <ul className="space-y-1 text-sm">
              {data.body_map_markers.map((m, i) => (
                <li key={i}>
                  {m.label}{m.quadrant ? ` — ${m.quadrant}, ${m.clock_position || ''}` : ''}{m.notes ? ` — ${m.notes}` : ''} ({m.x_pct}%, {m.y_pct}%)
                </li>
              ))}
            </ul>
          </section>
        )}

        {include.visit_readiness && data.visit_readiness && data.visit_readiness.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg mb-3">Visit readiness — prepared answers</h3>
            <p className="text-xs text-charcoal/50 mb-3">Your own words, prepared in advance for clinician questions. Not a medical assessment.</p>
            <ul className="space-y-2">
              {data.visit_readiness.map((v, i) => (
                <li key={i} className="text-sm">
                  <span className="text-charcoal/50">{v.question_key.replace(/_/g, ' ')}:</span> {v.answer}
                </li>
              ))}
            </ul>
          </section>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
