import supabase from './db-client.js';
import { cors } from './_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const slug = req.query?.slug;
      if (slug) {
        const { data, error } = await supabase
          .from('ba_education')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(data);
      }
      const { data, error } = await supabase
        .from('ba_education')
        .select('id, slug, title, category, summary, sort_order')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('education error:', err);
    res.status(500).json({ error: err.message });
  }
}
