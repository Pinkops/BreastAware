import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { apiGet, apiSend } from '../lib/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

export default function Redeem() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  const check = async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ is_premium: boolean; source: string | null }>('/api/redeem');
      setIsPremium(data.is_premium);
      setSource(data.source);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { void check(); }, []);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError('Enter your Gumroad license key or bonus code'); return; }
    setSaving(true); setError(''); setMsg('');
    try {
      const data = await apiSend<{ ok: boolean; message: string; source: string }>('/api/redeem', 'POST', { license_key: code.trim() });
      setMsg(data.message); setIsPremium(true); setSource(data.source); setCode('');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Redeem failed'); } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner label="Checking premium status…" />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Redeem Premium Kit" subtitle="Bought the $39 Premium Kit on Gumroad? Enter your license key from receipt, or bonus code BA-PREMIUM-2026 from README.txt to unlock premium." />
      <div className="rounded-2xl border border-forest/20 bg-white p-6 shadow-soft">
        {isPremium ? (
          <div className="flex gap-3">
            <CheckCircle2 className="w-6 h-6 text-forest shrink-0" />
            <div>
              <p className="font-medium text-charcoal">Premium unlocked ✅</p>
              <p className="text-sm text-charcoal/60 mt-1">Source: {source || 'unknown'} — thank you for supporting BreastAware. Premium: enhanced Body Map, Visit Summary selective PDF, future templates.</p>
              <Link to="/summary" className="btn-primary mt-4 inline-flex">Go to Visit Summary</Link>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-display text-lg flex items-center gap-2"><Gift className="w-5 h-5 text-forest" /> Enter code</h3>
            <form onSubmit={redeem} className="mt-4 space-y-3">
              <div>
                <label htmlFor="code" className="text-sm font-medium block mb-1">Gumroad license key or bonus code</label>
                <input id="code" className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., BA-PREMIUM-2026 or your Gumroad license" />
                <p className="text-xs text-charcoal/50 mt-1">Find license in Gumroad receipt. Bonus code in Premium Kit README.txt = BA-PREMIUM-2026</p>
              </div>
              {error && <p className="text-sm text-rose-deep flex gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
              {msg && <p className="text-sm text-forest bg-forest/8 border border-forest/20 rounded-xl px-3 py-2 flex gap-2"><CheckCircle2 className="w-4 h-4" /> {msg}</p>}
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Verifying…' : 'Unlock premium'}</button>
            </form>
            <div className="mt-6 rounded-xl bg-ivory border border-border p-4 text-xs text-charcoal/70 leading-relaxed">
              <p className="font-medium text-charcoal">How verification works</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Set GUMROAD_PRODUCT_ID + BONUS_CODE in Vercel env</li>
                <li>App calls https://api.gumroad.com/v2/licenses/verify server-side</li>
                <li>On success, sets profiles.is_premium = true</li>
                <li>No secret in client</li>
              </ul>
            </div>
          </>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}
