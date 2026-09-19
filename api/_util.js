// Shared helpers for API functions (BA-009, BA-013).

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
