import supabase from './_db-client.js';
import { cors } from './_auth.js';
import { serverError } from './_util.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { email, source } = req.body || {};
      if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 320) {
        return res.status(400).json({ error: 'Valid email required' });
      }
      const cleanEmail = email.trim().toLowerCase().slice(0, 320);
      const cleanSource = String(source || 'starter').slice(0, 50);

      try {
        await supabase.from('leads').insert({ email: cleanEmail, source: cleanSource });
      } catch {}
      try {
        await supabase.from('ba_leads').insert({ email: cleanEmail, source: cleanSource });
      } catch {}

      return res.status(200).json({ ok: true, message: 'Email saved — generating your printable summary' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, message: 'Leads endpoint — POST email to save' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'leads error');
  }
}
