import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Stethoscope, FileText } from 'lucide-react';
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        title="Doctor Prep"
        subtitle="Collect questions, symptoms, and history you want to discuss. Pair this with your Health Summary for a structured visit conversation."
        action={
          <Link to="/summary" className="btn-secondary">
            <FileText className="w-4 h-4" />
            Health Summary
          </Link>
        }
      />

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
          <Plus className="w-4 h-4 text-forest" /> Add prep item
        </h3>
        <div>
          <label className="text-sm font-medium block mb-1">Category</label>
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Content</label>
          <textarea required rows={3} className="input-field resize-y" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your question or note…" />
        </div>
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
          Mark as priority for this visit
        </label>
        <button type="submit" className="btn-primary">Save item</button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No prep items yet"
          description="Add questions and details you want ready before your next appointment."
        />
      ) : (
        <div className="space-y-4">
          <h3 className="font-display text-lg">Open items ({open.length})</h3>
          {open.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] uppercase tracking-wide text-forest font-semibold">{item.category}</span>
                    {item.is_priority && <span className="text-[10px] px-2 py-0.5 rounded-full bg-coral/15 text-coral font-medium">Priority</span>}
                  </div>
                  <p className="text-sm text-charcoal leading-relaxed">{item.content}</p>
                </div>
                <button type="button" className="text-charcoal/30 hover:text-rose-deep p-1 h-fit" aria-label="Delete prep item" onClick={() => removeItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-charcoal/60">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={!!item.is_complete} onChange={() => toggle(item, 'is_complete')} />
                  Discussed / done
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={!!item.is_priority} onChange={() => toggle(item, 'is_priority')} />
                  Priority
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={item.included_in_summary !== false} onChange={() => toggle(item, 'included_in_summary')} />
                  Include in summary
                </label>
              </div>
            </div>
          ))}

          {done.length > 0 && (
            <>
              <h3 className="font-display text-lg text-charcoal/50 pt-2">Completed ({done.length})</h3>
              {done.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/60 bg-white/60 p-3 opacity-70 flex justify-between">
                  <p className="text-sm line-through text-charcoal/50">{item.content}</p>
                  <button type="button" className="text-xs text-forest" onClick={() => toggle(item, 'is_complete')}>Restore</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
