import { describe, it, expect, vi } from 'vitest';
import { pick, clampNumber, validDate, rateLimit } from './_util.js';

describe('pick', () => {
  it('allows only listed fields', () => {
    const body = { side: 'left', label: 'test', user_id: 'evil', x_pct: 10 };
    const out = pick(body, ['side', 'label']);
    expect(out).toEqual({ side: 'left', label: 'test' });
    expect(out).not.toHaveProperty('user_id');
    expect(out).not.toHaveProperty('x_pct');
  });

  it('slices strings by limits', () => {
    const body = { label: 'a'.repeat(200) };
    const out = pick(body, ['label'], { limits: { label: 100 } });
    expect(out.label.length).toBe(100);
  });

  it('coerces booleans', () => {
    const body = { completed: true, title: 'x' };
    const out = pick(body, ['completed', 'title'], { booleans: ['completed'] });
    expect(out.completed).toBe(true);
    const body2 = { completed: 'yes' };
    const out2 = pick(body2, ['completed'], { booleans: ['completed'] });
    expect(out2.completed).toBe(false);
  });

  it('ignores undefined', () => {
    const body = { side: undefined, label: 'hi' };
    const out = pick(body, ['side', 'label']);
    expect(out).toEqual({ label: 'hi' });
  });
});

describe('clampNumber', () => {
  it('returns null for non-numbers', () => {
    expect(clampNumber(undefined, 0, 100)).toBe(null);
    expect(clampNumber('', 0, 100)).toBe(null);
    expect(clampNumber('abc', 0, 100)).toBe(null);
  });

  it('clamps within range', () => {
    expect(clampNumber(150, 0, 100)).toBe(100);
    expect(clampNumber(-10, 0, 100)).toBe(0);
    expect(clampNumber(50, 0, 100)).toBe(50);
  });

  it('parses numeric strings', () => {
    expect(clampNumber('42', 0, 100)).toBe(42);
  });
});

describe('validDate', () => {
  it('validates real dates', () => {
    expect(validDate('2026-09-20')).toBe(true);
    expect(validDate('2026-09-20T10:00:00Z')).toBe(true);
  });

  it('rejects invalid', () => {
    expect(validDate('')).toBe(false);
    expect(validDate(null)).toBe(false);
    expect(validDate('not-a-date')).toBe(false);
  });
});

describe('rateLimit', () => {
  it('allows under limit and blocks over', () => {
    const req = { headers: {}, socket: { remoteAddress: '1.2.3.4' } };
    const res = { headersSent: false, setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };

    for (let i = 0; i < 60; i++) {
      expect(rateLimit(req, res, { limit: 60, windowMs: 60000, keyPrefix: 'test' })).toBe(true);
    }
    expect(rateLimit(req, res, { limit: 60, windowMs: 60000, keyPrefix: 'test' })).toBe(false);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
