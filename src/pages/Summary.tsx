import { useEffect, useState, useRef } from 'react';
import { FileText, Printer, Download } from 'lucide-react';
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
  body_map_markers: Array<{ label: string; notes?: string; x_pct: number; y_pct: number }>;
  visit_readiness: Array<{ question_key: string; answer: string }>;
}

export default function Summary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breastaware-visit-summary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner label="Building your summary…" />;
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
        title="Visit Summary"
        subtitle="A concise packet for clinician conversations. Generated from your private records — not a medical report, diagnosis, or risk assessment."
        action={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button type="button" className="btn-primary" onClick={downloadJson}>
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        }
      />

      <div ref={printRef} className="print-area space-y-5">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-6 h-6 text-forest shrink-0" />
            <div>
              <h2 className="font-display text-xl text-charcoal">BreastAware visit summary</h2>
              <p className="text-xs text-charcoal/50 mt-1">Generated {formatDateTime(data.generated_at)}</p>
              {data.profile?.preferred_name && (
                <p className="text-sm text-charcoal/70 mt-1">Prepared for: {data.profile.preferred_name}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-charcoal/75 leading-relaxed border-l-2 border-coral/40 pl-3">{data.disclaimer}</p>
        </div>

        {baselineEntries.length > 0 && (
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

        {data.risk_notes.length > 0 && (
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

        {data.body_map_markers.length > 0 && (
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h3 className="font-display text-lg mb-3">Body map markers (approximate)</h3>
            <ul className="space-y-1 text-sm">
              {data.body_map_markers.map((m, i) => (
                <li key={i}>
                  {m.label}{m.notes ? ` — ${m.notes}` : ''} ({m.x_pct}%, {m.y_pct}%)
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.visit_readiness && data.visit_readiness.length > 0 && (
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
