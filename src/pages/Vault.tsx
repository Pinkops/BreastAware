import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { FolderLock, Upload, Trash2, ExternalLink, File, AlertTriangle } from 'lucide-react';
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
    void load();
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
      let file_name = '';
      if (file) {
        // MOVE 12 FIX: direct-to-storage — bypass Vercel 4.5MB limit
        const uploadUrlData = await apiSend<{ path: string; fileName: string; signedUrl: string; token: string }>('/api/vault-upload-url', 'POST', {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          fileSize: file.size,
        });

        const uploadRes = await fetch(uploadUrlData.signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });

        if (!uploadRes.ok) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (supabaseUrl && supabaseAnon) {
            const supabase = createClient(supabaseUrl, supabaseAnon);
            const { error } = await supabase.storage.from('ba-vault').uploadToSignedUrl(uploadUrlData.path, uploadUrlData.token, file);
            if (error) throw error;
          } else {
            throw new Error(`Direct upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
          }
        }
        file_name = uploadUrlData.fileName;
      }
      await apiSend('/api/vault', 'POST', {
        title: title.trim(),
        doc_type: docType,
        notes,
        document_date: documentDate || null,
        file_url: '',
        file_name,
      });
      setTitle(''); setNotes(''); setDocumentDate(''); setFile(null); load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      if (msg.includes('413') || msg.includes('too large') || msg.includes('Payload')) {
        setError('File too large for direct upload. Try a file under 10 MB, or compress PDF/image first.');
      } else { setError(msg); }
    } finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this document from your vault?')) return;
    try { await apiSend('/api/vault', 'DELETE', { id }); load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Delete failed'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Health Vault" subtitle="Store important breast-health documents in one private place. Direct-to-storage upload — supports up to 10 MB per file (fixed from 4.5MB Vercel limit)." />
      <div className="rounded-xl border border-forest/20 bg-forest/5 p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-forest shrink-0 mt-0.5" />
        <p className="text-xs text-charcoal/70">MOVE 12 FIX: Files now upload directly to private storage, bypassing Vercel's 4.5MB serverless payload limit. Your 10MB advertised limit now actually works. Files remain private with 10-min signed links.</p>
      </div>
      <Disclaimer compact />
      {error && <p className="text-sm text-rose-deep bg-rose-soft/30 border border-rose/20 rounded-xl px-4 py-3" role="alert">{error}</p>}
      <form onSubmit={submit} className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-3">
        <h3 className="font-display text-lg flex items-center gap-2"><Upload className="w-4 h-4 text-forest" /> Add document — direct upload</h3>
        <div><label htmlFor="v-title" className="text-sm font-medium block mb-1">Title *</label><input id="v-title" required className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Mammogram report — March 2026" /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label htmlFor="v-type" className="text-sm font-medium block mb-1">Type</label><select id="v-type" className="input-field" value={docType} onChange={(e) => setDocType(e.target.value)}>{DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          <div><label htmlFor="v-date" className="text-sm font-medium block mb-1">Document date</label><input id="v-date" type="date" className="input-field" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} /></div>
        </div>
        <div>
          <label htmlFor="v-file" className="text-sm font-medium block mb-1">File — up to 10 MB (PDF, PNG, JPG, WEBP)</label>
          <input id="v-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={onFile} className="block w-full text-sm text-charcoal/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-forest/10 file:text-forest file:text-sm" />
          {file && <p className="text-xs text-charcoal/60 mt-1">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB {file.size > 10 * 1024 * 1024 ? '(too large)' : ''}</p>}
        </div>
        <div><label htmlFor="v-notes" className="text-sm font-medium block mb-1">Notes</label><input id="v-notes" className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Official report, bring to visit" /></div>
        <button type="submit" className="btn-primary" disabled={busy || (file ? file.size > 10 * 1024 * 1024 : false)}>{busy ? 'Uploading directly to private storage…' : 'Save to vault (direct upload)'}</button>
        <p className="text-[11px] text-charcoal/45">Direct-to-storage: file goes straight to Supabase private bucket ba-vault, not through Vercel serverless. Max 10 MB enforced server-side.</p>
      </form>
      {docs.length === 0 ? <EmptyState icon={FolderLock} title="Vault is empty" description="Upload imaging reports, visit summaries, or other documents you want handy for appointments. Now supports up to 10 MB." /> : (
        <ul className="space-y-3">{docs.map((d) => (
          <li key={d.id} className="rounded-2xl border border-border bg-white p-4 shadow-soft flex items-start justify-between gap-3">
            <div className="flex gap-3 min-w-0"><div className="w-10 h-10 rounded-xl bg-forest/8 flex items-center justify-center shrink-0"><File className="w-5 h-5 text-forest" /></div>
            <div className="min-w-0"><p className="font-medium text-charcoal truncate">{d.title}</p><p className="text-xs text-charcoal/60 mt-0.5 capitalize">{d.doc_type.replace(/_/g, ' ')} {d.document_date ? ` · ${formatDate(d.document_date)}` : ''}</p>{d.notes && <p className="text-sm text-charcoal/70 mt-1">{d.notes}</p>}{d.signed_url && <a href={d.signed_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-forest mt-2 font-medium">Open file (10-min link) <ExternalLink className="w-3.5 h-3.5" /></a>}</div></div>
            <button type="button" className="text-charcoal/50 hover:text-rose-deep p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Delete document" onClick={() => remove(d.id)}><Trash2 className="w-4 h-4" /></button>
          </li>))}</ul>)}
    </div>
  );
}
