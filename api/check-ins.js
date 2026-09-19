import supabase from './db-client.js';
import { requireUser, cors } from './_auth.js';
import { serverError } from './_util.js';

const TYPES = ['no_change', 'noticed_change', 'question'];

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ba_check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!TYPES.includes(b.check_in_type)) {
        return res.status(400).json({ error: 'check_in_type must be one of: ' + TYPES.join(', ') });
      }
      const row = {
        user_id: user.id,
        check_in_type: b.check_in_type,
        notes: String(b.notes || '').slice(0, 2000),
      };
      const { data, error } = await supabase.from('ba_check_ins').insert(row).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'check-ins error');
  }
}
