import supabase from './_db-client.js';
import { requireUser, cors } from './_auth.js';
import { serverError } from './_util.js';

// Gumroad product ID — set in Vercel env GUMROAD_PRODUCT_ID
// User gets license key after purchase, enters in /redeem page

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'POST') {
      const { license_key, code } = req.body || {};
      const key = license_key || code;
      if (!key || typeof key !== 'string' || key.trim().length < 6) {
        return res.status(400).json({ error: 'License key or code required' });
      }

      const trimmed = key.trim();
      const BONUS_CODE = process.env.BONUS_CODE || 'BA-PREMIUM-2026';
      const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;

      let isValid = false;
      let source = '';

      if (trimmed.toUpperCase() === BONUS_CODE.toUpperCase()) {
        isValid = true;
        source = 'bonus_code';
      } else if (GUMROAD_PRODUCT_ID) {
        try {
          const params = new URLSearchParams();
          params.append('product_id', GUMROAD_PRODUCT_ID);
          params.append('license_key', trimmed);
          const gumRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });
          const gumData = await gumRes.json();
          if (gumData.success && gumData.purchase) {
            isValid = true;
            source = 'gumroad';
          }
        } catch (e) {
          console.error('Gumroad verify failed', e);
        }
      } else {
        if (trimmed.length >= 20) {
          isValid = true;
          source = 'dev_fallback';
        }
      }

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid license or bonus code. Check your Gumroad receipt or README.txt code BA-PREMIUM-2026.' });
      }

      // FIXED: use ba_profiles with user_id (not profiles with id)
      const { data: existing } = await supabase
        .from('ba_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('ba_profiles')
          .update({ is_premium: true, premium_source: source, premium_redeemed_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        await supabase.from('ba_profiles').insert({
          user_id: user.id,
          is_premium: true,
          premium_source: source,
          premium_redeemed_at: new Date().toISOString(),
          onboarding_complete: false,
        });
      }

      // Audit table — try both prefixed and non-prefixed
      try {
        await supabase.from('ba_entitlements').insert({
          user_id: user.id,
          product: 'premium_kit',
          source,
          license_key: trimmed.slice(0, 50),
        });
      } catch {}
      try {
        await supabase.from('entitlements').insert({
          user_id: user.id,
          product: 'premium_kit',
          source,
          license_key: trimmed.slice(0, 50),
        });
      } catch {}

      return res.status(200).json({ ok: true, premium: true, source, message: 'Premium unlocked — thank you for supporting BreastAware!' });
    }

    if (req.method === 'GET') {
      const { data } = await supabase.from('ba_profiles').select('is_premium, premium_source').eq('user_id', user.id).maybeSingle();
      return res.status(200).json({ is_premium: !!data?.is_premium, source: data?.premium_source || null });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    serverError(res, err, 'redeem error');
  }
}
