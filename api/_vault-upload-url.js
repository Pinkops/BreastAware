import supabase from './_db-client.js';
import { requireUser, cors } from './_auth.js';
import { serverError } from './_util.js';

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'POST') {
      const { fileName, contentType, fileSize } = req.body || {};
      if (!fileName || !contentType) {
        return res.status(400).json({ error: 'fileName and contentType required' });
      }
      if (!ALLOWED_MIME.includes(contentType)) {
        return res.status(415).json({ error: 'File type not allowed. Use PDF, PNG, JPG, WEBP.' });
      }
      if (fileSize && fileSize > MAX_BYTES) {
        return res.status(413).json({ error: 'File too large. Max 10 MB.' });
      }
      const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
      const path = `${user.id}/${Date.now()}_${safeName}`;

      // Create signed upload URL — client uploads directly to Supabase, bypassing Vercel 4.5MB limit
      const { data, error } = await supabase.storage
        .from('ba-vault')
        .createSignedUploadUrl(path);

      if (error) throw error;

      return res.status(200).json({
        path,
        fileName: path.split('/').pop(),
        signedUrl: data.signedUrl,
        token: data.token,
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'vault-upload-url error');
  }
}
