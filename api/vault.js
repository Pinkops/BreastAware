import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';
import { pick, validDate, serverError } from './_util.js';

const DOC_TYPES = ['imaging_report', 'lab', 'visit_summary', 'insurance', 'other'];
const FIELDS = ['title', 'doc_type', 'file_url', 'file_name', 'notes', 'document_date'];
const LIMITS = { title: 200, file_url: 1000, file_name: 200, notes: 2000 };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ba_vault_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = data || [];

      // BA-003: files live in a PRIVATE bucket. Attach a short-lived (10 min)
      // signed link per document so only the signed-in owner can open files.
      await Promise.all(rows.map(async (row) => {
        row.signed_url = null;
        if (row.file_name) {
          const { data: signed, error: signErr } = await supabase.storage
            .from('ba-vault')
            .createSignedUrl(`${user.id}/${row.file_name}`, 600);
          if (!signErr && signed?.signedUrl) row.signed_url = signed.signedUrl;
        }
      }));

      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.title || !String(b.title).trim()) {
        return res.status(400).json({ error: 'title required' });
      }
      if (!DOC_TYPES.includes(b.doc_type || 'other')) {
        return res.status(400).json({ error: 'doc_type must be one of: ' + DOC_TYPES.join(', ') });
      }
      if (b.document_date && !validDate(b.document_date)) {
        return res.status(400).json({ error: 'document_date must be a valid date' });
      }
      const row = {
        user_id: user.id,
        title: String(b.title).slice(0, 200),
        doc_type: b.doc_type || 'other',
        file_url: String(b.file_url || '').slice(0, 1000),
        file_name: String(b.file_name || '').slice(0, 200),
        notes: String(b.notes || '').slice(0, 2000),
        document_date: b.document_date || null,
      };
      const { data, error } = await supabase.from('ba_vault_documents').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: 'id required' });
      if (b.doc_type !== undefined && !DOC_TYPES.includes(b.doc_type)) {
        return res.status(400).json({ error: 'doc_type must be one of: ' + DOC_TYPES.join(', ') });
      }
      if (b.document_date && !validDate(b.document_date)) {
        return res.status(400).json({ error: 'document_date must be a valid date' });
      }
      const updates = pick(b, FIELDS, { limits: LIMITS });
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'no valid fields to update' });
      }
      const { data, error } = await supabase
        .from('ba_vault_documents')
        .update(updates)
        .eq('id', b.id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data: doc } = await supabase
        .from('ba_vault_documents')
        .select('file_name')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (doc?.file_name) {
        await supabase.storage.from('ba-vault').remove([`${user.id}/${doc.file_name}`]);
      }
      const { error } = await supabase
        .from('ba_vault_documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'vault error');
  }
}
