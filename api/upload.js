import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';
import { serverError } from './_util.js';

// BA-012: only real document/image types, max 10 MB — enforced here on the
// server, not just in the browser. Must match the bucket's allowlist.
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

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
      if (!ALLOWED_MIME.includes(contentType)) {
        return res.status(415).json({ error: 'File type not allowed. Please use PDF, PNG, JPG, or WEBP.' });
      }
      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length === 0) {
        return res.status(400).json({ error: 'File is empty.' });
      }
      if (buffer.length > MAX_BYTES) {
        return res.status(413).json({ error: 'File is too large. Maximum size is 10 MB.' });
      }
      const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
      const path = `${user.id}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage
        .from('ba-vault')
        .upload(path, buffer, { contentType, upsert: true });
      if (error) throw error;

      // BA-003: no public URLs. Files are opened later through short-lived
      // signed links generated in api/vault.js.
      return res.status(200).json({ fileName: path.split('/').pop(), path });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'upload error');
  }
}
