import { useEffect, useState, FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Trash2, Stethoscope, FileText, ClipboardList, MessageSquare } from 'lucide-react';
import { apiGet, apiSend } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Disclaimer from '../components/Disclaimer';

interface PrepItem {
  id: number;
  category: string;
  content: string;
  is_priority?: boolean;
  included_in_summary?: boolean;
  is_complete?: boolean;
}

const CATEGORIES = [
  { value: 'question', label: 'Question for my clinician' },
  { value: 'symptom', label: 'Symptom / change to mention' },
  { value: 'history', label: 'History detail' },
  { value: 'medication', label: 'Medication / supplement' },
  { value: 'goal', label: 'Visit goal' },
  { value: 'other', label: 'Other' },
];

const PROMPTS = [
  'When did I first notice this change?',
  'Has it changed in size, feel, or appearance?',
  'Does it relate to my menstrual cycle?',
  'What imaging or exams have I had before?',
  'Is there family history I should mention?',
  'What follow-up timeline should I expect?',
];

export default function DoctorPrep() {
  const location = useLocation();
  const [items, setItems] = useState<PrepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('question');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState(false);

  const load = async () => {
    try {
      const data = await apiGet<PrepItem[]>('/api/doctor-prep');
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await apiSend('/api/doctor-prep', 'POST', {
        category,
        content: content.trim(),
        is_priority: priority,
        included_in_summary: true,
      });
      setContent('');
      setPriority(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const toggle = async (item: PrepItem, field: 'is_complete' | 'is_priority' | 'included_in_summary') => {
    try {
      await apiSend('/api/doctor-prep', 'PUT', { id: item.id, [field]: !item[field] });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const removeItem = async (id: number) => {
    if (!confirm('Delete this prep item? This cannot be undone.')) return;
    try {
      await apiSend('/api/doctor-prep', 'DELETE', { id });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  const open = items.filter((i) => !i.is_complete);
  const done = items.filter((i) => i.is_complete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prepare for Visit"
        subtitle="Part 1 of 2 — Your questions and goals for the clinician. Pair with Prepared Answers (43 Qs) and Visit Summary for a complete packet."
        action={
          <Link to="/summary" className="btn-secondary">
            <FileText className="w-4 h-4" />
            Visit Summary
          </Link>
        }
      />

      {/* MOVE 6: Merged tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white border border-border w-fit">
        <Link to="/doctor-prep" className={`px-4 py-2 rounded-lg text-sm font-medium ${location.pathname === '/doctor-prep' ? 'bg-forest text-ivory' : 'text-charcoal/70'}`}>
          <span className="inline-flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> My Questions</span>
        </Link>
        <Link to="/visit-readiness" className={`px-4 py-2 rounded-lg text-sm font-medium ${location.pathname === '/visit-readiness' ? 'bg-forest text-ivory' : 'text-charcoal/70'}`}>
          <span className="inline-flex items-center gap-1.5"><ClipboardList className="w-4 h-4" /> Prepared Answers (43)</span>
        </Link>
      </div>

      <div className="rounded-xl border border-forest/20 bg-forest/5 p-3 text-xs text-charcoal/70">
        Flow: <span className="font-medium">Record change → Body Map → Timeline → Prepare (Questions + Answers) → Visit Summary</span> — your packet for clinician conversation.
      </div>

      <Disclaimer compact />
      {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}

      <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
        <h3 className="font-display text-lg mb-2">Conversation starters</h3>
        <p className="text-xs text-charcoal/50 mb-3">Tap to draft a question — edit before saving.</p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              className="text-xs px-3 py-1.5 rounded-full border border-border text-charcoal/70 hover:border-forest/40 hover:bg-forest/5"
              onClick={() => {
                setCategory('question');
                setContent(p);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={add} className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-3">
        <h3 className="font-display text-lg flex items-center gap-2">
          <Plus className="w-4 h-4 text-forest" /> Add question or note
        </h3>
        <div>
          <label className="text-sm font-medium block mb-1">Category</label>
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Content</label>
          <textarea rows={3} className="input-field resize-y" value={content} onChange={(e) => setContent(e.target.value)} placeholder="e.g., When should I come back if this doesn't change?" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
          Mark as priority (shows first in Visit Summary)
        </label>
        <button type="submit" className="btn-primary">Save to prep list</button>
      </form>

      <section className="space-y-3">
        <h3 className="font-display text-lg">To discuss ({open.length})</h3>
        {open.length === 0 ? (
          <EmptyState icon={Stethoscope} title="No open questions" description="Add questions you want to remember to ask. They will be included in your Visit Summary." />
        ) : (
          open.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft flex gap-3">
              <input type="checkbox" checked={!!item.is_complete} onChange={() => toggle(item, 'is_complete')} className="mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-forest">{item.category}</p>
                <p className="text-sm text-charcoal mt-1">{item.content}</p>
                <div className="flex gap-2 mt-2">
                  <button type="button" className={`text-xs px-2 py-1 rounded-full border ${item.is_priority ? 'bg-coral/10 border-coral/30 text-coral' : 'border-border text-charcoal/50'}`} onClick={() => toggle(item, 'is_priority')}>{item.is_priority ? 'Priority' : 'Mark priority'}</button>
                  <button type="button" className={`text-xs px-2 py-1 rounded-full border ${item.included_in_summary ? 'bg-forest/10 border-forest/20 text-forest' : 'border-border text-charcoal/50'}`} onClick={() => toggle(item, 'included_in_summary')}>{item.included_in_summary ? 'In summary' : 'Not in summary'}</button>
                </div>
              </div>
              <button type="button" className="text-charcoal/30 hover:text-rose-deep p-2 h-fit" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-lg text-charcoal/60">Completed ({done.length})</h3>
          {done.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/60 bg-ivory/50 p-4 flex gap-3 opacity-70">
              <input type="checkbox" checked onChange={() => toggle(item, 'is_complete')} className="mt-1" />
              <p className="text-sm text-charcoal/60 line-through">{item.content}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
