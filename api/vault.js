import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';

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
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.title) return res.status(400).json({ error: 'title required' });
      const row = {
        user_id: user.id,
        title: b.title,
        doc_type: b.doc_type || 'other',
        file_url: b.file_url || '',
        file_name: b.file_name || '',
        notes: b.notes || '',
        document_date: b.document_date || null,
      };
      const { data, error } = await supabase
        .from('ba_vault_documents')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase
        .from('ba_vault_documents')
        .update(updates)
        .eq('id', id)
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
    console.error('vault error:', err);
    res.status(500).json({ error: err.message });
  }
}
