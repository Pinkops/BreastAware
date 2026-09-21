import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Eye, Trash2, Plus, Filter, MapPin, MessageSquare, CheckCircle2, Circle } from 'lucide-react';
import { apiGet, apiSend, formatDate, formatDateTime } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Disclaimer from '../components/Disclaimer';

interface Observation {
  id: number;
  change_type: string;
  observed_at: string;
  side: string;
  location_description?: string;
  notes?: string;
  discussed_with_provider?: boolean;
  duration?: string;
  size_description?: string;
  texture?: string;
}

interface Appointment {
  id: number;
  title: string;
  appointment_date: string;
  appointment_time?: string;
  provider_name?: string;
  completed?: boolean;
}

interface Screening {
  id: number;
  screening_type: string;
  screening_date: string;
  facility?: string;
  next_due_date?: string;
}

type TimelineItem =
  | { kind: 'observation'; date: string; data: Observation }
  | { kind: 'appointment'; date: string; data: Appointment }
  | { kind: 'screening'; date: string; data: Screening };

export default function Journal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [filterKind, setFilterKind] = useState<'all' | 'observation' | 'appointment' | 'screening'>('all');
  const [filterSide, setFilterSide] = useState<'all' | 'left' | 'right' | 'both' | 'not_specified'>('all');
  const [filterDiscussed, setFilterDiscussed] = useState<'all' | 'discussed' | 'pending'>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [obs, appts, screens] = await Promise.all([
        apiGet<Observation[]>('/api/observations'),
        apiGet<Appointment[]>('/api/appointments'),
        apiGet<Screening[]>('/api/screenings'),
      ]);
      const timeline: TimelineItem[] = [
        ...obs.map((o) => ({ kind: 'observation' as const, date: o.observed_at, data: o })),
        ...appts.map((a) => ({ kind: 'appointment' as const, date: a.appointment_date, data: a })),
        ...screens.map((s) => ({ kind: 'screening' as const, date: s.screening_date, data: s })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(timeline);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const deleteObs = async (id: number) => {
    if (!confirm('Remove this observation from your journal? This cannot be undone.')) return;
    try {
      await apiSend('/api/observations', 'DELETE', { id });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const toggleDiscussed = async (obs: Observation) => {
    try {
      await apiSend('/api/observations', 'PUT', { id: obs.id, discussed_with_provider: !obs.discussed_with_provider });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterKind !== 'all' && item.kind !== filterKind) return false;
      if (item.kind === 'observation') {
        const o = item.data as Observation;
        if (filterSide !== 'all' && o.side !== filterSide) return false;
        if (filterDiscussed === 'discussed' && !o.discussed_with_provider) return false;
        if (filterDiscussed === 'pending' && o.discussed_with_provider) return false;
        if (search) {
          const hay = `${o.change_type} ${o.location_description || ''} ${o.notes || ''} ${o.size_description || ''}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
      } else {
        if (filterSide !== 'all') return false;
        if (filterDiscussed !== 'all') return false;
        if (search) {
          const txt = item.kind === 'appointment' ? (item.data as Appointment).title : (item.data as Screening).screening_type;
          if (!txt.toLowerCase().includes(search.toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [items, filterKind, filterSide, filterDiscussed, search]);

  const stats = useMemo(() => {
    const obs = items.filter((i) => i.kind === 'observation') as { kind: 'observation'; data: Observation }[];
    return {
      total: items.length,
      obsCount: obs.length,
      pending: obs.filter((o) => !o.data.discussed_with_provider).length,
      discussed: obs.filter((o) => o.data.discussed_with_provider).length,
    };
  }, [items]);

  if (loading) return <LoadingSpinner label="Loading timeline…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Journal — Timeline"
        subtitle="Your private timeline of observations, appointments, and screenings. Filter, review patterns, and mark what you've discussed with your clinician."
        action={
          <Link to="/log-change" className="btn-primary">
            <Plus className="w-4 h-4" />
            Record change
          </Link>
        }
      />

      {/* Hero stats */}
      <div className="grid sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Total records</p>
          <p className="text-2xl font-display text-charcoal mt-1">{stats.total}</p>
          <p className="text-xs text-charcoal/50 mt-1">{stats.obsCount} observations</p>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-800/70">To discuss</p>
          <p className="text-2xl font-display text-amber-900 mt-1">{stats.pending}</p>
          <p className="text-xs text-amber-800/60 mt-1">Not yet marked discussed</p>
        </div>
        <div className="rounded-2xl border border-forest/20 bg-forest/5 p-4">
          <p className="text-xs uppercase tracking-wide text-forest/60">Discussed</p>
          <p className="text-2xl font-display text-forest mt-1">{stats.discussed}</p>
          <p className="text-xs text-forest/60 mt-1">Marked as discussed</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-charcoal/50">Next step</p>
          <Link to="/summary" className="inline-flex items-center gap-1 text-sm font-medium text-forest mt-2">Visit Summary <Plus className="w-3 h-3" /></Link>
          <p className="text-xs text-charcoal/50 mt-1">Generate packet for visit</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-white p-4 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-forest">
          <Filter className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Filters — make timeline visit-ready</h3>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1">Type</label>
            <select className="input-field text-sm" value={filterKind} onChange={(e) => setFilterKind(e.target.value as any)}>
              <option value="all">All types</option>
              <option value="observation">Observations only</option>
              <option value="appointment">Appointments</option>
              <option value="screening">Screenings</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Side</label>
            <select className="input-field text-sm" value={filterSide} onChange={(e) => setFilterSide(e.target.value as any)}>
              <option value="all">All sides</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="both">Both</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Follow-up status</label>
            <select className="input-field text-sm" value={filterDiscussed} onChange={(e) => setFilterDiscussed(e.target.value as any)}>
              <option value="all">All</option>
              <option value="pending">To discuss</option>
              <option value="discussed">Discussed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Search notes</label>
            <input className="input-field text-sm" placeholder="e.g., pea, tender, upper outer" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <p className="text-[11px] text-charcoal/45">Showing {filtered.length} of {items.length} records. Filters help you spot patterns and prepare a focused Visit Summary.</p>
      </div>

      <Disclaimer compact />
      {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={items.length === 0 ? 'Your journal is empty' : 'No records match filters'}
          description={items.length === 0 ? 'When you log observations or add screenings and appointments, they will appear here in chronological order.' : 'Try clearing side or follow-up filters, or search for a different term.'}
          action={items.length === 0 ? <Link to="/log-change" className="btn-primary">Log your first observation</Link> : <button type="button" className="btn-secondary" onClick={() => { setFilterKind('all'); setFilterSide('all'); setFilterDiscussed('all'); setSearch(''); }}>Clear filters</button>}
        />
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-6">
          {filtered.map((item) => (
            <li key={`${item.kind}-${item.data.id}`} className="pl-6 relative">
              <span className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-ivory ${item.kind === 'observation' ? 'bg-coral' : 'bg-forest'}`} />
              <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-soft">
                {item.kind === 'observation' && (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-coral">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Observation</span>
                        {item.data.discussed_with_provider ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full ml-2"><CheckCircle2 className="w-3 h-3" /> Discussed</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 border border-amber-200/60 text-amber-800 px-2 py-0.5 rounded-full ml-2"><Circle className="w-3 h-3" /> To discuss</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-charcoal/35 hover:text-rose-deep p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Delete observation"
                        onClick={() => deleteObs(item.data.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-medium text-charcoal mt-2 capitalize">
                      {item.data.change_type.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-charcoal/50 mt-1">{formatDateTime(item.data.observed_at)} · {item.data.side !== 'not_specified' ? item.data.side : 'side not specified'}</p>
                    <div className="mt-2 text-sm text-charcoal/70 space-y-1">
                      {item.data.location_description && <p>Location: {item.data.location_description}</p>}
                      {item.data.size_description && <p>Size: {item.data.size_description}</p>}
                      {item.data.texture && <p>Feel: {item.data.texture}</p>}
                      {item.data.duration && <p>Duration: {item.data.duration}</p>}
                      {item.data.notes && <p className="mt-2 text-charcoal/80 leading-relaxed">{item.data.notes}</p>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => toggleDiscussed(item.data)} className={`text-xs px-3 py-1.5 rounded-full border ${item.data.discussed_with_provider ? 'bg-forest/10 border-forest/20 text-forest' : 'bg-amber-50 border-amber-200/60 text-amber-800'}`}>
                        {item.data.discussed_with_provider ? 'Mark as to discuss' : 'Mark as discussed'}
                      </button>
                      <Link to="/body-map" className="text-xs px-3 py-1.5 rounded-full border border-border bg-white text-charcoal/70 hover:border-forest/30 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Mark on Body Map</Link>
                      <Link to="/doctor-prep" className="text-xs px-3 py-1.5 rounded-full border border-border bg-white text-charcoal/70 hover:border-forest/30 inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Add question</Link>
                    </div>
                  </>
                )}
                {item.kind === 'appointment' && (
                  <>
                    <div className="flex items-center gap-2 text-forest">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Appointment</span>
                      {item.data.completed && <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full">Completed</span>}
                    </div>
                    <h3 className="font-medium text-charcoal mt-2">{item.data.title}</h3>
                    <p className="text-xs text-charcoal/50 mt-1">
                      {formatDate(item.data.appointment_date)}
                      {item.data.appointment_time ? ` · ${item.data.appointment_time}` : ''}
                    </p>
                    {item.data.provider_name && (
                      <p className="text-sm text-charcoal/70 mt-1">{item.data.provider_name}</p>
                    )}
                  </>
                )}
                {item.kind === 'screening' && (
                  <>
                    <div className="flex items-center gap-2 text-forest">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Screening</span>
                    </div>
                    <h3 className="font-medium text-charcoal mt-2 capitalize">
                      {item.data.screening_type.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-charcoal/50 mt-1">{formatDate(item.data.screening_date)}</p>
                    {item.data.facility && <p className="text-sm text-charcoal/70 mt-1">{item.data.facility}</p>}
                    {item.data.next_due_date && <p className="text-xs text-forest mt-1">Next reminder: {formatDate(item.data.next_due_date)}</p>}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
