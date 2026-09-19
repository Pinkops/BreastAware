import supabase from './_db-client.js';

export async function requireUser(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
  return user;
}

// BA-010: the app is same-origin (the browser and this API live on the same
// domain), so cross-origin access is intentionally NOT allowed. We send no
// Access-Control-Allow-Origin header, which stops other websites from calling
// this API with a user's token. Kept as a no-op so call sites stay unchanged.
export function cors(res) {
  // Intentionally empty — see note above.
}
