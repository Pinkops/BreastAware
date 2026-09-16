import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'POST') {
      const { fileName, fileBase64, contentType } = req.body || {};
      if (!fileName || !fileBase64) {
        return res.status(400).json({ error: 'fileName and fileBase64 required' });
      }
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${Date.now()}_${safeName}`;
      const buffer = Buffer.from(fileBase64, 'base64');
      const { error } = await supabase.storage
        .from('ba-vault')
        .upload(path, buffer, { contentType: contentType || 'application/octet-stream', upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('ba-vault').getPublicUrl(path);
      return res.status(200).json({ url: urlData.publicUrl, fileName: path.split('/').pop(), path });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('upload error:', err);
    res.status(500).json({ error: err.message });
  }
}
