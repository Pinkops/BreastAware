import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { FolderLock, Upload, Trash2, ExternalLink, File } from 'lucide-react';
import { apiGet, apiSend, formatDate } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Disclaimer from '../components/Disclaimer';

interface Doc {
  id: number;
  title: string;
  doc_type: string;
  file_url?: string;
  signed_url?: string | null;
  file_name?: string;
  notes?: string;
  document_date?: string;
  created_at?: string;
}

const DOC_TYPES = [
  { value: 'imaging_report', label: 'Imaging report' },
  { value: 'lab', label: 'Lab / pathology' },
  { value: 'visit_summary', label: 'Visit summary' },
  { value: 'insurance', label: 'Insurance / authorization' },
  { value: 'other', label: 'Other' },
];

export default function Vault() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('imaging_report');
  const [notes, setNotes] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    try {
      const data = await apiGet<Doc[]>('/api/vault');
      setDocs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let file_url = '';
      let file_name = '';
      if (file) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
         const uploaded = await apiSend<{ fileName: string }>('/api/upload', 'POST', {
          fileName: file.name,
          fileBase64: base64,
          contentType: file.type,
        });
        file_url = '';
        file_name = uploaded.fileName;
      }
      await apiSend('/api/vault', 'POST', {
        title: title.trim(),
        doc_type: docType,
        notes,
        document_date: documentDate || null,
        file_url,
        file_name,
      });
      setTitle('');
      setNotes('');
      setDocumentDate('');
      setFile(null);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this document from your vault?')) return;
    try {
      await apiSend('/api/vault', 'DELETE', { id });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Vault"
        subtitle="Store important breast-health documents in one private place. Keep official reports from your care team as the source of truth."
      />

      <Disclaimer compact />

      {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}

      <form onSubmit={submit} className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-3">
        <h3 className="font-display text-lg flex items-center gap-2">
          <Upload className="w-4 h-4 text-forest" /> Add document
        </h3>
        <div>
          <label className="text-sm font-medium block mb-1">Title</label>
          <input required className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Mammogram report — March 2026" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">Type</label>
            <select className="input-field" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Document date</label>
            <input type="date" className="input-field" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">File (optional)</label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={onFile} className="block w-full text-sm text-charcoal/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-forest/10 file:text-forest file:text-sm" />
          {file && <p className="text-xs text-charcoal/50 mt-1">{file.name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Notes</label>
          <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save to vault'}
        </button>
      </form>

      {docs.length === 0 ? (
        <EmptyState
          icon={FolderLock}
          title="Vault is empty"
          description="Upload imaging reports, visit summaries, or other documents you want handy for appointments."
        />
      ) : (
        <ul className="space-y-3">
          {docs.map((d) => (
            <li key={d.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft flex items-start justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-forest/8 flex items-center justify-center shrink-0">
                  <File className="w-5 h-5 text-forest" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-charcoal truncate">{d.title}</p>
                  <p className="text-xs text-charcoal/50 mt-0.5 capitalize">
                    {d.doc_type.replace(/_/g, ' ')}
                    {d.document_date ? ` · ${formatDate(d.document_date)}` : ''}
                  </p>
                  {d.notes && <p className="text-sm text-charcoal/65 mt-1">{d.notes}</p>}
                  {d.signed_url && (
                    <a href={d.signed_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-forest mt-2 font-medium">
                      Open file <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <button type="button" className="text-charcoal/30 hover:text-rose-deep p-1" aria-label="Delete" onClick={() => remove(d.id)}>
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
