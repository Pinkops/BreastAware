import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  NotebookPen,
  ClipboardList,
  BookOpen,
  CircleDot,
  FileText,
  CalendarClock,
  ChevronRight,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';
import { apiGet, greetingForNow, formatDate, formatDateTime } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

interface Profile {
  preferred_name?: string;
  onboarding_complete?: boolean;
}
interface Observation {
  id: number;
  change_type: string;
  observed_at: string;
  side: string;
  location_description?: string;
  notes?: string;
}
interface Screening {
  id: number;
  screening_type: string;
  next_due_date?: string;
  screening_date: string;
}
interface Appointment {
  id: number;
  title: string;
  appointment_date: string;
  appointment_time?: string;
  provider_name?: string;
  completed?: boolean;
}
interface VisitReadiness {
  question_key: string;
  answer: string;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [readiness, setReadiness] = useState<VisitReadiness[]>([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [p, o, s, a, r] = await Promise.all([
        apiGet<Profile | null>('/api/profile'),
        apiGet<Observation[]>('/api/observations'),
        apiGet<Screening[]>('/api/screenings'),
        apiGet<Appointment[]>('/api/appointments'),
        apiGet<VisitReadiness[]>('/api/visit-readiness').catch(() => [] as VisitReadiness[]),
      ]);
      setProfile(p);
      setObservations(o);
      setScreenings(s);
      setAppointments(a);
      setReadiness(r as VisitReadiness[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingSpinner label="Opening your space…" />;

  const name = profile?.preferred_name;
  const greeting = greetingForNow();
  const hasObservations = observations.length > 0;
  const hasReadiness = readiness.length > 0;

  const upcoming = appointments
    .filter((a) => !a.completed && new Date(a.appointment_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0];

  const nextScreening = screenings
    .filter((s) => s.next_due_date)
    .sort((a, b) => (a.next_due_date || '').localeCompare(b.next_due_date || ''))[0];

  const recentThree = observations.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header - Visit-Ready Promise */}
      <div>
        <p className="text-sm text-forest font-medium tracking-wide">{greeting}{name ? `, ${name}` : ''}</p>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal mt-1 leading-tight">Record what you notice.<br />Organize it for conversations.</h1>
        <p className="text-sm text-charcoal/60 mt-2 max-w-2xl leading-relaxed">
          A private system for turning observations into clear info you can share with your clinician — not a diagnosis, not a risk score.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose/30 bg-rose-soft/30 px-4 py-3 text-sm text-rose-deep" role="alert">
          {error}
        </div>
      )}

      {/* MOVE 2: 3 primary actions */}
      <section aria-labelledby="primary-actions">
        <h2 id="primary-actions" className="sr-only">Primary actions</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/log-change" className="group rounded-2xl border border-forest/20 bg-forest text-ivory p-5 shadow-soft hover:bg-forest/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest/40">
            <div className="w-10 h-10 rounded-xl bg-ivory/15 flex items-center justify-center mb-3">
              <NotebookPen className="w-5 h-5" />
            </div>
            <p className="font-display text-lg leading-tight">Record a change</p>
            <p className="text-xs text-ivory/70 mt-1.5 leading-relaxed">Date, side, what changed, size, how long — your words</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium mt-3 bg-ivory/15 px-2.5 py-1 rounded-full">Start <ChevronRight className="w-3 h-3" /></span>
          </Link>

          <Link to="/visit-readiness" className="group rounded-2xl border border-border bg-white p-5 shadow-soft hover:border-forest/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest/40">
            <div className="w-10 h-10 rounded-xl bg-forest/8 flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5 text-forest" />
            </div>
            <p className="font-display text-lg leading-tight text-charcoal">Prepare for visit</p>
            <p className="text-xs text-charcoal/55 mt-1.5 leading-relaxed">43 questions clinicians may ask — answer in advance so you don&apos;t have to recall on the spot</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium mt-3 text-forest">Prepare <ChevronRight className="w-3 h-3" /></span>
            {hasReadiness && <span className="ml-2 inline-flex text-[11px] bg-forest/8 text-forest px-2 py-0.5 rounded-full">{readiness.length} answered</span>}
          </Link>

          <Link to="/journal" className="group rounded-2xl border border-border bg-white p-5 shadow-soft hover:border-forest/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest/40">
            <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-coral" />
            </div>
            <p className="font-display text-lg leading-tight text-charcoal">Review timeline</p>
            <p className="text-xs text-charcoal/55 mt-1.5 leading-relaxed">Your observations in chronological order — notice patterns, prepare summary</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium mt-3 text-charcoal/70">Open journal <ChevronRight className="w-3 h-3" /></span>
            {hasObservations && <span className="ml-2 inline-flex text-[11px] bg-ivory border border-border px-2 py-0.5 rounded-full">{observations.length} records</span>}
          </Link>
        </div>
      </section>

      {/* Timeline Hero - MOVE 6 */}
      <section className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden">
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-border/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-forest" />
            <h2 className="font-display text-lg text-charcoal">Recent timeline</h2>
          </div>
          <Link to="/journal" className="text-xs font-medium text-forest hover:underline inline-flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
        </div>

        {!hasObservations ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-forest/8 flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-forest/60" />
            </div>
            <h3 className="font-medium text-charcoal">No observations yet — that&apos;s normal to start</h3>
            <p className="text-sm text-charcoal/60 mt-2 max-w-md mx-auto leading-relaxed">
              Most people start by describing their normal, then recording when something feels different. Your first record creates your baseline.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              <Link to="/know-my-normal" className="btn-secondary text-sm"><CircleDot className="w-4 h-4" /> Describe my normal</Link>
              <Link to="/log-change" className="btn-primary text-sm"><NotebookPen className="w-4 h-4" /> Log first change</Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {recentThree.map((o) => (
              <li key={o.id} className="p-4 sm:p-5 flex gap-3">
                <div className="w-2 h-2 rounded-full bg-coral mt-2 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize text-charcoal">{o.change_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-charcoal/50 mt-0.5">{formatDateTime(o.observed_at)} · {o.side !== 'not_specified' ? o.side : 'side not specified'}</p>
                  {o.location_description && <p className="text-sm text-charcoal/70 mt-1 truncate">{o.location_description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Context cards - 3 states logic */}
      <section className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-forest mb-2">
            <CircleDot className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Know my normal</h3>
          </div>
          {profile?.onboarding_complete ? (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest mt-0.5 shrink-0" />
              <p className="text-sm text-charcoal/70">Baseline described. You can update anytime in Know My Normal.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-charcoal/60">Describe your usual look and feel — makes changes easier to spot and explain.</p>
              <Link to="/know-my-normal" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">Set baseline <ChevronRight className="w-4 h-4" /></Link>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-forest mb-2">
            <CalendarClock className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Next appointment</h3>
          </div>
          {upcoming ? (
            <>
              <p className="text-charcoal font-medium text-sm">{upcoming.title}</p>
              <p className="text-xs text-charcoal/60 mt-1">{formatDate(upcoming.appointment_date)}{upcoming.appointment_time ? ` · ${upcoming.appointment_time}` : ''}</p>
              <Link to="/summary" className="inline-flex items-center gap-1 text-xs text-forest mt-3 font-medium border border-forest/20 rounded-full px-2.5 py-1">Generate visit summary <ChevronRight className="w-3 h-3" /></Link>
            </>
          ) : (
            <>
              <p className="text-sm text-charcoal/60">No upcoming visit saved.</p>
              <Link to="/screening" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">Add appointment <ChevronRight className="w-4 h-4" /></Link>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-forest mb-2">
            <FileText className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Visit summary</h3>
          </div>
          {hasObservations || hasReadiness ? (
            <>
              <p className="text-sm text-charcoal/70">Ready to create a packet for your clinician — observations + prepared answers.</p>
              <Link to="/summary" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">Open visit summary <ChevronRight className="w-4 h-4" /></Link>
            </>
          ) : (
            <>
              <p className="text-sm text-charcoal/60">After you record and prepare, generate a concise packet to share.</p>
              <span className="inline-flex text-xs text-charcoal/40 mt-3">Complete 1 observation to unlock</span>
            </>
          )}
        </div>
      </section>

      {/* Secondary reminder */}
      {nextScreening?.next_due_date && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-charcoal/70 flex gap-2">
          <CalendarClock className="w-4 h-4 text-amber-700/70 shrink-0 mt-0.5" />
          <span>Screening reminder: <span className="font-medium capitalize">{nextScreening.screening_type.replace(/_/g, ' ')}</span> around {formatDate(nextScreening.next_due_date)} — reminder only, follow your clinician&apos;s plan.</span>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
