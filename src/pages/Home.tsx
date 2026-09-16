import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  NotebookPen,
  CalendarClock,
  ChevronRight,
  MessageCircleQuestion,
  Eye,
  CheckCircle2,
  Stethoscope,
  Clock,
} from 'lucide-react';
import { apiGet, apiSend, greetingForNow, formatDate } from '../lib/api';
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
interface PrepItem {
  id: number;
  content: string;
  is_complete?: boolean;
  is_priority?: boolean;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prep, setPrep] = useState<PrepItem[]>([]);
  const [checkInMsg, setCheckInMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [p, o, s, a, d] = await Promise.all([
        apiGet<Profile | null>('/api/profile'),
        apiGet<Observation[]>('/api/observations'),
        apiGet<Screening[]>('/api/screenings'),
        apiGet<Appointment[]>('/api/appointments'),
        apiGet<PrepItem[]>('/api/doctor-prep'),
      ]);
      setProfile(p);
      setObservations(o);
      setScreenings(s);
      setAppointments(a);
      setPrep(d);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCheckIn = async (type: string, note: string) => {
    setCheckInMsg('');
    try {
      await apiSend('/api/check-ins', 'POST', { check_in_type: type, notes: note });
      setCheckInMsg(
        type === 'no_change'
          ? 'Noted. Keeping a calm record of ordinary days is part of self-awareness.'
          : type === 'noticed_change'
            ? 'When you are ready, log the details so you have a clear record for your clinician.'
            : 'Add your question in Doctor Prep so it is ready for your visit.'
      );
    } catch (err: unknown) {
      setCheckInMsg(err instanceof Error ? err.message : 'Could not save check-in');
    }
  };

  if (loading) return <LoadingSpinner label="Opening your space…" />;

  const name = profile?.preferred_name;
  const greeting = greetingForNow();
  const recent = observations[0];
  const upcoming = appointments
    .filter((a) => !a.completed && new Date(a.appointment_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0];
  const nextScreening = screenings
    .filter((s) => s.next_due_date)
    .sort((a, b) => (a.next_due_date || '').localeCompare(b.next_due_date || ''))[0];
  const incompletePrep = prep.filter((p) => !p.is_complete);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-forest font-medium tracking-wide">{greeting}{name ? `, ${name}` : ''}</p>
        <h1 className="font-display text-2xl sm:text-3xl text-charcoal mt-1">Your breast health space</h1>
        <p className="text-sm text-charcoal/60 mt-1.5 max-w-xl leading-relaxed">
          A calm place to notice, record, and prepare — not to diagnose.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose/30 bg-rose-soft/30 px-4 py-3 text-sm text-rose-deep" role="alert">
          {error}
        </div>
      )}

      {/* Hero */}
      <section className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-forest/5 via-white to-rose-soft/20">
          <p className="text-xs uppercase tracking-widest text-forest/80 font-medium mb-2">Guiding principle</p>
          <h2 className="font-display text-2xl sm:text-3xl text-charcoal mb-3">Know your normal</h2>
          <p className="text-charcoal/70 leading-relaxed max-w-xl mb-6">
            Become familiar with the usual look and feel of your breasts so you can recognize changes and discuss them
            with a healthcare professional. This app organizes your notes — it does not decide what a change means.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/log-change" className="btn-primary">
              <NotebookPen className="w-4 h-4" />
              Log a Change
            </Link>
            <Link to="/journal" className="btn-secondary">
              <Clock className="w-4 h-4" />
              Check My Timeline
            </Link>
          </div>
        </div>
      </section>

      {/* Quick check-in */}
      <section>
        <h3 className="font-display text-lg text-charcoal mb-3">Quick check-in</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleCheckIn('no_change', 'No difference noticed today')}
            className="card-interactive text-left p-4"
          >
            <CheckCircle2 className="w-5 h-5 text-forest mb-2" />
            <p className="text-sm font-medium text-charcoal">I haven’t noticed anything different</p>
            <p className="text-xs text-charcoal/50 mt-1">Record an ordinary day</p>
          </button>
          <Link to="/log-change" className="card-interactive text-left p-4 block" onClick={() => handleCheckIn('noticed_change', 'Planning to log a change')}>
            <Eye className="w-5 h-5 text-coral mb-2" />
            <p className="text-sm font-medium text-charcoal">I noticed something I want to record</p>
            <p className="text-xs text-charcoal/50 mt-1">Open the observation log</p>
          </Link>
          <Link to="/doctor-prep" className="card-interactive text-left p-4 block" onClick={() => handleCheckIn('question', 'Has a question for clinician')}>
            <MessageCircleQuestion className="w-5 h-5 text-forest mb-2" />
            <p className="text-sm font-medium text-charcoal">I have a question for my healthcare professional</p>
            <p className="text-xs text-charcoal/50 mt-1">Save it for your visit</p>
          </Link>
        </div>
        {checkInMsg && (
          <p className="mt-3 text-sm text-charcoal/70 bg-white border border-border rounded-xl px-4 py-3">{checkInMsg}</p>
        )}
      </section>

      {/* Snapshot cards */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-forest mb-3">
            <CalendarClock className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Next screening reminder</h3>
          </div>
          {nextScreening?.next_due_date ? (
            <>
              <p className="text-charcoal font-medium capitalize">{nextScreening.screening_type.replace(/_/g, ' ')}</p>
              <p className="text-sm text-charcoal/60 mt-1">Suggested follow-up around {formatDate(nextScreening.next_due_date)}</p>
              <p className="text-xs text-charcoal/45 mt-2">Dates you enter are reminders only — follow your clinician’s plan.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-charcoal/60">No upcoming screening date on file.</p>
              <Link to="/screening" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">
                Add screening history <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-forest mb-3">
            <Eye className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Recent observation</h3>
          </div>
          {recent ? (
            <>
              <p className="text-charcoal font-medium capitalize">{recent.change_type.replace(/_/g, ' ')}</p>
              <p className="text-sm text-charcoal/60 mt-1">
                {formatDate(recent.observed_at)}
                {recent.side && recent.side !== 'not_specified' ? ` · ${recent.side}` : ''}
              </p>
              <Link to="/journal" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">
                View journal <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-charcoal/60">No observations yet. Logging what you notice builds a useful personal record.</p>
              <Link to="/log-change" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">
                Log a change <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-forest mb-3">
            <CalendarClock className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Upcoming appointment</h3>
          </div>
          {upcoming ? (
            <>
              <p className="text-charcoal font-medium">{upcoming.title}</p>
              <p className="text-sm text-charcoal/60 mt-1">
                {formatDate(upcoming.appointment_date)}
                {upcoming.appointment_time ? ` · ${upcoming.appointment_time}` : ''}
                {upcoming.provider_name ? ` · ${upcoming.provider_name}` : ''}
              </p>
              <Link to="/screening" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">
                Manage appointments <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-charcoal/60">No upcoming appointment saved.</p>
              <Link to="/screening" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">
                Add appointment <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-forest mb-3">
            <Stethoscope className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Doctor preparation</h3>
          </div>
          {incompletePrep.length > 0 ? (
            <>
              <p className="text-charcoal font-medium">{incompletePrep.length} item{incompletePrep.length === 1 ? '' : 's'} ready to review</p>
              <p className="text-sm text-charcoal/60 mt-1 line-clamp-2">{incompletePrep[0].content}</p>
              <Link to="/doctor-prep" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">
                Complete prep <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-charcoal/60">No open prep items. Add questions or history notes before your next visit.</p>
              <Link to="/doctor-prep" className="inline-flex items-center gap-1 text-sm text-forest mt-3 font-medium">
                Open Doctor Prep <ChevronRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}
