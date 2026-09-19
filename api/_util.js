// Shared helpers for API functions (BA-009, BA-013, BA-011).

// Build an object from ONLY the allowed fields. Anything the client sends
// that is not in `fields` (for example user_id) is silently ignored.
export function pick(body, fields, opts = {}) {
  const { limits = {}, booleans = [] } = opts;
  const out = {};
  for (const f of fields) {
    let v = body[f];
    if (v === undefined) continue;
    if (booleans.includes(f)) {
      v = v === true;
    } else if (typeof v === 'string' && limits[f]) {
      v = v.slice(0, limits[f]);
    }
    out[f] = v;
  }
  return out;
}

// Clamp a value into a numeric range; returns null when not a usable number.
export function clampNumber(v, min, max) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

// True when the value parses as a real date.
export function validDate(s) {
  if (!s) return false;
  return !Number.isNaN(new Date(s).getTime());
}

// Log details server-side; never leak internals to the client (BA-013).
export function serverError(res, err, label) {
  console.error(`${label}:`, err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  }
}

// BA-011 / BA-062: Simple in-memory rate limiter (free, no external deps).
// Per-instance memory — Vercel may run multiple instances, so this is a
// best-effort protection, not a distributed guarantee. Good enough for Hobby
// and far better than no limit. For stronger guarantees, replace with
// Upstash Redis later (still free tier).
const _store = new Map(); // key -> { count, reset }

function _getIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length) return fwd[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function rateLimit(req, res, opts = {}) {
  const limit = opts.limit ?? 60;
  const windowMs = opts.windowMs ?? 60 * 1000;
  const keyPrefix = opts.keyPrefix ?? 'global';
  const ip = _getIp(req);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  let entry = _store.get(key);
  if (!entry || now > entry.reset) {
    entry = { count: 1, reset: now + windowMs };
    _store.set(key, entry);
    return true;
  }

  entry.count += 1;

  // Periodic cleanup to avoid unbounded growth (1% chance per request)
  if (Math.random() < 0.01) {
    for (const [k, v] of _store) {
      if (now > v.reset) _store.delete(k);
    }
  }

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.reset - now) / 1000);
    if (!res.headersSent) {
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests. Please slow down and try again in a moment.' });
    }
    return false;
  }
  return true;
}
