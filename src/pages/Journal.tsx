import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Eye, Trash2, Plus } from 'lucide-react';
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
}

type TimelineItem =
  | { kind: 'observation'; date: string; data: Observation }
  | { kind: 'appointment'; date: string; data: Appointment }
  | { kind: 'screening'; date: string; data: Screening };

export default function Journal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<TimelineItem[]>([]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const deleteObs = async (id: number) => {
    if (!confirm('Remove this observation from your journal?')) return;
    try {
      await apiSend('/api/observations', 'DELETE', { id });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Journal"
        subtitle="A timeline of your observations, appointments, and screenings — for your eyes and your care team when you choose to share."
        action={
          <Link to="/log-change" className="btn-primary">
            <Plus className="w-4 h-4" />
            Log change
          </Link>
        }
      />

      <Disclaimer compact />

      {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your journal is empty"
          description="When you log observations or add screenings and appointments, they will appear here in chronological order."
          action={
            <Link to="/log-change" className="btn-primary">Log your first observation</Link>
          }
        />
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-6">
          {items.map((item) => (
            <li key={`${item.kind}-${item.data.id}`} className="pl-6 relative">
              <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-forest ring-4 ring-ivory" />
              <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-soft">
                {item.kind === 'observation' && (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-coral">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Observation</span>
                      </div>
                      <button
                        type="button"
                        className="text-charcoal/35 hover:text-rose-deep p-1"
                        aria-label="Delete observation"
                        onClick={() => deleteObs(item.data.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-medium text-charcoal mt-2 capitalize">
                      {item.data.change_type.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-charcoal/50 mt-1">{formatDateTime(item.data.observed_at)}</p>
                    <div className="mt-2 text-sm text-charcoal/70 space-y-1">
                      {item.data.side !== 'not_specified' && <p>Side: {item.data.side}</p>}
                      {item.data.location_description && <p>Location: {item.data.location_description}</p>}
                      {item.data.size_description && <p>Size: {item.data.size_description}</p>}
                      {item.data.duration && <p>Duration: {item.data.duration}</p>}
                      {item.data.notes && <p className="mt-2 text-charcoal/80">{item.data.notes}</p>}
                      {item.data.discussed_with_provider && (
                        <p className="text-xs text-forest mt-2">Marked as discussed with a provider</p>
                      )}
                    </div>
                  </>
                )}
                {item.kind === 'appointment' && (
                  <>
                    <div className="flex items-center gap-2 text-forest">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Appointment</span>
                    </div>
                    <h3 className="font-medium text-charcoal mt-2">{item.data.title}</h3>
                    <p className="text-xs text-charcoal/50 mt-1">
                      {formatDate(item.data.appointment_date)}
                      {item.data.appointment_time ? ` · ${item.data.appointment_time}` : ''}
                    </p>
                    {item.data.provider_name && (
                      <p className="text-sm text-charcoal/70 mt-1">{item.data.provider_name}</p>
                    )}
                    {item.data.completed && <p className="text-xs text-forest mt-2">Completed</p>}
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
