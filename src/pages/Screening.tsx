import { useEffect, useState, FormEvent } from 'react';
import { Plus, Trash2, CalendarHeart, AlertTriangle } from 'lucide-react';
import { apiGet, apiSend, formatDate } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

interface Screening {
  id: number;
  screening_type: string;
  facility?: string;
  screening_date: string;
  result_summary?: string;
  next_due_date?: string;
  notes?: string;
}

interface Appointment {
  id: number;
  title: string;
  provider_name?: string;
  appointment_date: string;
  appointment_time?: string;
  location?: string;
  notes?: string;
  completed?: boolean;
}

interface RiskNote {
  id: number;
  category: string;
  description: string;
  notes?: string;
}

const SCREEN_TYPES = [
  { value: 'mammogram', label: 'Mammogram' },
  { value: 'clinical_breast_exam', label: 'Clinical breast exam' },
  { value: 'ultrasound', label: 'Breast ultrasound' },
  { value: 'mri', label: 'Breast MRI' },
  { value: 'biopsy', label: 'Biopsy (procedure record)' },
  { value: 'other', label: 'Other' },
];

const RISK_CATEGORIES = [
  { value: 'family_history', label: 'Family history' },
  { value: 'personal_history', label: 'Personal breast history' },
  { value: 'genetic', label: 'Genetic / counseling note' },
  { value: 'lifestyle', label: 'Lifestyle factor (self-noted)' },
  { value: 'other', label: 'Other' },
];

const RISK_EDU = [
  { title: 'Age', text: 'Breast cancer risk generally increases with age. Screening recommendations often change across decades of life — ask your clinician what applies to you.' },
  { title: 'Family & genetics', text: 'Close relatives with breast, ovarian, or related cancers, or known gene variants, may affect screening timing. This is educational context, not a personal risk score.' },
  { title: 'Dense breast tissue', text: 'Dense tissue is common and can make mammograms harder to read. Your imaging report may mention density; discuss follow-up options with your provider.' },
  { title: 'Prior breast conditions', text: 'Prior biopsies or certain benign findings can influence how clinicians follow you. Keep records in Health Vault when possible.' },
  { title: 'Hormones & reproductive history', text: 'Factors such as age at first period, pregnancy history, and hormone therapy are sometimes discussed in clinical risk conversations — not scored here.' },
  { title: 'Lifestyle factors', text: 'Physical activity, alcohol use, and body weight are general topics clinicians may discuss. Lifestyle notes here are optional personal reminders only.' },
];

export default function Screening() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [risks, setRisks] = useState<RiskNote[]>([]);
  const [tab, setTab] = useState<'screenings' | 'appointments' | 'risk'>('screenings');

  const [sForm, setSForm] = useState({ screening_type: 'mammogram', facility: '', screening_date: '', result_summary: '', next_due_date: '', notes: '' });
  const [aForm, setAForm] = useState({ title: '', provider_name: '', appointment_date: '', appointment_time: '', location: '', notes: '' });
  const [rForm, setRForm] = useState({ category: 'family_history', description: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [s, a, r] = await Promise.all([ apiGet<Screening[]>('/api/screenings'), apiGet<Appointment[]>('/api/appointments'), apiGet<RiskNote[]>('/api/risk-notes') ]);
      setScreenings(s); setAppointments(a); setRisks(r);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(); }, []);

  const addScreening = async (e: FormEvent) => { e.preventDefault(); try { await apiSend('/api/screenings', 'POST', sForm); setSForm({ screening_type: 'mammogram', facility: '', screening_date: '', result_summary: '', next_due_date: '', notes: '' }); load(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); } };
  const addAppt = async (e: FormEvent) => { e.preventDefault(); try { await apiSend('/api/appointments', 'POST', aForm); setAForm({ title: '', provider_name: '', appointment_date: '', appointment_time: '', location: '', notes: '' }); load(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); } };
  const addRisk = async (e: FormEvent) => { e.preventDefault(); try { await apiSend('/api/risk-notes', 'POST', rForm); setRForm({ category: 'family_history', description: '', notes: '' }); load(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); } };
  const deleteScreening = async (id: number) => { if (!confirm('Delete this screening record? This cannot be undone.')) return; try { await apiSend('/api/screenings', 'DELETE', { id }); load(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Delete failed'); } };
  const deleteAppointment = async (id: number) => { if (!confirm('Delete this appointment? This cannot be undone.')) return; try { await apiSend('/api/appointments', 'DELETE', { id }); load(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Delete failed'); } };
  const deleteRisk = async (id: number) => { if (!confirm('Delete this note? This cannot be undone.')) return; try { await apiSend('/api/risk-notes', 'DELETE', { id }); load(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Delete failed'); } };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Screening & Risk" subtitle="Organize screening history and appointments, and keep personal notes about topics often discussed as risk factors. No scores or predictions are generated." />
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-700/80 shrink-0 mt-0.5" /><p className="text-sm text-charcoal/75 leading-relaxed">BreastAware does <strong>not</strong> calculate your individual cancer risk or recommend screening intervals. U.S. guidelines vary by age and history — follow advice from your healthcare professional.</p></div>
      <Disclaimer compact />
      {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}
      <div role="tablist" aria-label="Screening sections" className="flex gap-1 p-1 rounded-xl bg-white border border-border w-full sm:w-auto overflow-x-auto">
        {([['screenings','Screenings'],['appointments','Appointments'],['risk','Risk notes']] as const).map(([k,label])=>(
          <button key={k} type="button" role="tab" aria-selected={tab===k} aria-controls={`panel-${k}`} id={`tab-${k}`} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest/40 ${tab===k?'bg-forest text-ivory':'text-charcoal/70 hover:text-charcoal'}`}>{label}</button>
        ))}
      </div>
      {tab==='screenings' && (
        <div id="panel-screenings" role="tabpanel" aria-labelledby="tab-screenings" className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={addScreening} className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-3">
            <h3 className="font-display text-lg flex items-center gap-2"><Plus className="w-4 h-4 text-forest" /> Add screening</h3>
            <div><label htmlFor="s-type" className="text-sm font-medium block mb-1">Type</label><select id="s-type" className="input-field" value={sForm.screening_type} onChange={(e)=>setSForm({...sForm,screening_type:e.target.value})}>{SCREEN_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label htmlFor="s-date" className="text-sm font-medium block mb-1">Date</label><input id="s-date" type="date" required className="input-field" value={sForm.screening_date} onChange={(e)=>setSForm({...sForm,screening_date:e.target.value})} /></div>
            <div><label htmlFor="s-facility" className="text-sm font-medium block mb-1">Facility</label><input id="s-facility" className="input-field" value={sForm.facility} onChange={(e)=>setSForm({...sForm,facility:e.target.value})} /></div>
            <div><label htmlFor="s-result" className="text-sm font-medium block mb-1">Result summary (your words)</label><textarea id="s-result" rows={2} className="input-field resize-y" value={sForm.result_summary} onChange={(e)=>setSForm({...sForm,result_summary:e.target.value})} placeholder="e.g., routine screen; await official report" /></div>
            <div><label htmlFor="s-next" className="text-sm font-medium block mb-1">Next due (reminder only)</label><input id="s-next" type="date" className="input-field" value={sForm.next_due_date} onChange={(e)=>setSForm({...sForm,next_due_date:e.target.value})} /></div>
            <div><label htmlFor="s-notes" className="text-sm font-medium block mb-1">Notes</label><input id="s-notes" className="input-field" value={sForm.notes} onChange={(e)=>setSForm({...sForm,notes:e.target.value})} /></div>
            <button type="submit" className="btn-primary">Save screening</button>
          </form>
          <div className="space-y-3">{screenings.length===0?<p className="text-sm text-charcoal/60 p-4">No screenings recorded yet.</p>:screenings.map(s=>(
            <div key={s.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft flex justify-between gap-3"><div><p className="font-medium capitalize">{s.screening_type.replace(/_/g,' ')}</p><p className="text-xs text-charcoal/60 mt-0.5">{formatDate(s.screening_date)}{s.facility?` · ${s.facility}`:''}</p>{s.result_summary&&<p className="text-sm text-charcoal/70 mt-2">{s.result_summary}</p>}{s.next_due_date&&<p className="text-xs text-forest mt-1">Next reminder: {formatDate(s.next_due_date)}</p>}</div><button type="button" className="text-charcoal/50 hover:text-rose-deep p-2 h-fit min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Delete screening" onClick={()=>deleteScreening(s.id)}><Trash2 className="w-4 h-4" /></button></div>
          ))}</div>
        </div>
      )}
      {tab==='appointments' && (
        <div id="panel-appointments" role="tabpanel" aria-labelledby="tab-appointments" className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={addAppt} className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-3">
            <h3 className="font-display text-lg flex items-center gap-2"><CalendarHeart className="w-4 h-4 text-forest" /> Add appointment</h3>
            <div><label htmlFor="a-title" className="text-sm font-medium block mb-1">Title</label><input id="a-title" required className="input-field" value={aForm.title} onChange={(e)=>setAForm({...aForm,title:e.target.value})} placeholder="e.g., Annual visit, mammogram" /></div>
            <div className="grid grid-cols-2 gap-3"><div><label htmlFor="a-date" className="text-sm font-medium block mb-1">Date</label><input id="a-date" type="date" required className="input-field" value={aForm.appointment_date} onChange={(e)=>setAForm({...aForm,appointment_date:e.target.value})} /></div><div><label htmlFor="a-time" className="text-sm font-medium block mb-1">Time</label><input id="a-time" type="time" className="input-field" value={aForm.appointment_time} onChange={(e)=>setAForm({...aForm,appointment_time:e.target.value})} /></div></div>
            <div><label htmlFor="a-provider" className="text-sm font-medium block mb-1">Provider</label><input id="a-provider" className="input-field" value={aForm.provider_name} onChange={(e)=>setAForm({...aForm,provider_name:e.target.value})} /></div>
            <div><label htmlFor="a-location" className="text-sm font-medium block mb-1">Location</label><input id="a-location" className="input-field" value={aForm.location} onChange={(e)=>setAForm({...aForm,location:e.target.value})} /></div>
            <div><label htmlFor="a-notes" className="text-sm font-medium block mb-1">Notes</label><input id="a-notes" className="input-field" value={aForm.notes} onChange={(e)=>setAForm({...aForm,notes:e.target.value})} /></div>
            <button type="submit" className="btn-primary">Save appointment</button>
          </form>
          <div className="space-y-3">{appointments.map(a=>(
            <div key={a.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft flex justify-between gap-3"><div><p className="font-medium">{a.title}</p><p className="text-xs text-charcoal/60 mt-0.5">{formatDate(a.appointment_date)}{a.appointment_time?` · ${a.appointment_time}`:''}</p>{a.provider_name&&<p className="text-sm text-charcoal/70 mt-1">{a.provider_name}</p>}<label htmlFor={`a-complete-${a.id}`} className="flex items-center gap-2 mt-2 text-xs text-charcoal/70"><input id={`a-complete-${a.id}`} type="checkbox" checked={!!a.completed} onChange={async()=>{await apiSend('/api/appointments','PUT',{id:a.id,completed:!a.completed}); load();}} />Mark completed</label></div><button type="button" className="text-charcoal/50 hover:text-rose-deep p-2 h-fit min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Delete appointment" onClick={()=>deleteAppointment(a.id)}><Trash2 className="w-4 h-4" /></button></div>
          ))}</div>
        </div>
      )}
      {tab==='risk' && (
        <div id="panel-risk" role="tabpanel" aria-labelledby="tab-risk" className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft"><h3 className="font-display text-lg text-charcoal mb-3">General risk factor education</h3><p className="text-sm text-charcoal/70 mb-4 leading-relaxed">The topics below are commonly discussed in plain-language education from organizations such as the CDC, American Cancer Society, and USPSTF. They are <em>not</em> used to compute a score in this app.</p><div className="grid sm:grid-cols-2 gap-3">{RISK_EDU.map(r=>(<div key={r.title} className="rounded-xl bg-ivory border border-border p-3"><p className="text-sm font-semibold text-forest">{r.title}</p><p className="text-xs text-charcoal/70 mt-1 leading-relaxed">{r.text}</p></div>))}</div></section>
          <div className="grid lg:grid-cols-2 gap-6">
            <form onSubmit={addRisk} className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-3"><h3 className="font-display text-lg">Personal risk-related notes</h3><p className="text-xs text-charcoal/60">For your records and doctor conversations — not interpreted by the app.</p><div><label htmlFor="r-category" className="text-sm font-medium block mb-1">Category</label><select id="r-category" className="input-field" value={rForm.category} onChange={(e)=>setRForm({...rForm,category:e.target.value})}>{RISK_CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div><div><label htmlFor="r-desc" className="text-sm font-medium block mb-1">Description</label><textarea id="r-desc" required rows={3} className="input-field resize-y" value={rForm.description} onChange={(e)=>setRForm({...rForm,description:e.target.value})} /></div><div><label htmlFor="r-notes" className="text-sm font-medium block mb-1">Extra notes</label><input id="r-notes" className="input-field" value={rForm.notes} onChange={(e)=>setRForm({...rForm,notes:e.target.value})} /></div><button type="submit" className="btn-primary">Save note</button></form>
            <div className="space-y-3">{risks.map(r=>(<div key={r.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft flex justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-forest font-medium">{r.category.replace(/_/g,' ')}</p><p className="text-sm text-charcoal mt-1">{r.description}</p>{r.notes&&<p className="text-xs text-charcoal/60 mt-1">{r.notes}</p>}</div><button type="button" className="text-charcoal/50 hover:text-rose-deep p-2 h-fit min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Delete risk note" onClick={()=>deleteRisk(r.id)}><Trash2 className="w-4 h-4" /></button></div>))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
