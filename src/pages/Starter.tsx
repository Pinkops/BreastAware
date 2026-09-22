import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Printer, Mail, CheckCircle2, ClipboardList, MapPin, FileText, ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Disclaimer from '../components/Disclaimer';

export default function Starter() {
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const [whenFirst, setWhenFirst] = useState('');
  const [side, setSide] = useState('left');
  const [where, setWhere] = useState('');
  const [size, setSize] = useState('');
  const [pain, setPain] = useState('');
  const [duration, setDuration] = useState('');
  const [question, setQuestion] = useState('');

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter valid email to generate printable result'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'starter-pwa' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setEmailSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save email');
    } finally { setSaving(false); }
  };

  const hasContent = whenFirst || where || size || question;

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center">
            <Heart className="w-5 h-5 text-ivory" />
          </div>
          <div>
            <p className="font-display text-lg leading-none">BreastAware</p>
            <p className="text-[11px] text-charcoal/60 uppercase tracking-wide">Free PWA • Prints result for doctor</p>
          </div>
        </div>

        <PageHeader
          title="Free PWA — 1-Page Visit Summary Generator"
          subtitle="Enter what you noticed in 2 minutes, add your email to generate, print result to bring to your healthcare provider. Then try full private app for timeline + 43 Qs + vault."
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-4">
            <h3 className="font-display text-lg flex items-center gap-2"><ClipboardList className="w-4 h-4 text-forest" /> What you noticed — your words</h3>

            <div>
              <label className="text-sm font-medium block mb-1">When did you first notice it?</label>
              <input className="input-field" value={whenFirst} onChange={(e) => setWhenFirst(e.target.value)} placeholder="e.g., 3 weeks ago, March 2026" />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Which side?</label>
              <div className="flex gap-2">
                {['left','right','both'].map(s => (
                  <button key={s} type="button" onClick={() => setSide(s)} className={`px-3 py-1.5 rounded-full text-sm border ${side===s ? 'bg-forest text-ivory border-forest' : 'bg-white border-border'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Where exactly?</label>
              <input className="input-field" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="e.g., upper outer left, 2 o'clock, near nipple" />
              <p className="text-[11px] text-charcoal/45 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Use quadrant + clock like doctors do</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Size (your words)</label>
                <input className="input-field" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g., pea-sized" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Pain / tenderness</label>
                <input className="input-field" value={pain} onChange={(e) => setPain(e.target.value)} placeholder="e.g., 2/10 tender when pressed" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">How long present?</label>
              <input className="input-field" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 2 weeks, since last period" />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Top question for clinician</label>
              <input className="input-field" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g., When should I come back if no change?" />
            </div>

            {!emailSaved ? (
              <form onSubmit={saveEmail} className="rounded-xl bg-forest/5 border border-forest/20 p-4 space-y-3">
                <p className="text-sm font-medium text-charcoal flex items-center gap-2"><Mail className="w-4 h-4 text-forest" /> Enter email to generate printable result</p>
                <p className="text-xs text-charcoal/60">We save email to send you full app link + premium kit info. No spam, private, you can delete anytime. This is the email gate.</p>
                <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., maria@gmail.com" />
                {error && <p className="text-xs text-rose-deep">{error}</p>}
                <button type="submit" disabled={saving} className="btn-primary w-full justify-center">{saving ? 'Saving…' : 'Unlock printable result →'}</button>
              </form>
            ) : (
              <div className="rounded-xl bg-forest/10 border border-forest/20 p-3 flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest mt-0.5" />
                <p className="text-xs text-charcoal/70">Email {email} saved — printable result unlocked below. You can now print and take to appointment.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div ref={printRef} className="rounded-2xl border-2 border-forest/20 bg-white p-6 shadow-soft print-area">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center"><Heart className="w-4 h-4 text-ivory" /></div>
                <div>
                  <p className="font-display text-base leading-none">BreastAware — Visit Summary (Free Starter)</p>
                  <p className="text-[10px] text-charcoal/50 mt-1">Generated {new Date().toLocaleDateString()} • Private • Not a diagnosis</p>
                </div>
              </div>

              {!hasContent ? (
                <p className="text-sm text-charcoal/50 italic">Fill form on left to generate your 1-page summary here — ready to print for clinician conversation.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="border-l-2 border-coral/40 pl-3">
                    <p className="text-xs uppercase tracking-wide text-forest/70">What I noticed</p>
                    <p className="mt-1"><span className="text-charcoal/50">When:</span> {whenFirst || '—'}</p>
                    <p><span className="text-charcoal/50">Side:</span> {side} {where ? `• ${where}` : ''}</p>
                    <p><span className="text-charcoal/50">Size:</span> {size || '—'} {pain ? `• Pain: ${pain}` : ''}</p>
                    <p><span className="text-charcoal/50">Duration:</span> {duration || '—'}</p>
                  </div>
                  <div className="border-l-2 border-forest/20 pl-3">
                    <p className="text-xs uppercase tracking-wide text-forest/70">Top question for clinician</p>
                    <p className="mt-1">{question || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-ivory border border-border p-3 text-xs text-charcoal/60">
                    <p className="font-medium text-charcoal/80">What to Bring to visit</p>
                    <p className="mt-1">ID, insurance, medication list, prior imaging reports, implant card if applicable, this sheet printed</p>
                  </div>
                  <p className="text-[11px] text-charcoal/45 border-t border-border pt-3">BreastAware is private organizer — does not diagnose, does not calculate risk, does not replace mammogram/clinical exam. For personal notes only. Bring official reports as source of truth.</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button type="button" disabled={!emailSaved || !hasContent} onClick={() => window.print()} className="btn-primary flex-1 justify-center disabled:opacity-40">
                <Printer className="w-4 h-4" /> {emailSaved ? 'Print result for doctor' : 'Enter email to print'}
              </button>
              <Link to="/" className="btn-secondary"><ArrowRight className="w-4 h-4" /> Full app</Link>
            </div>

            {emailSaved && (
              <div className="rounded-2xl border border-forest/20 bg-forest text-ivory p-5 space-y-3">
                <h3 className="font-display text-lg">Want timeline + 43 Qs + vault?</h3>
                <p className="text-sm text-ivory/80 leading-relaxed">This free PWA is 1-page only. Full app (free account) gives you: private timeline with filters, Body Map with quadrants/clock, 43 prepared answers, selective Visit Summary (8 sections), Health Vault direct upload up to 10MB, and premium printable kit $39.</p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/" className="bg-ivory text-forest px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1">Create free account →</Link>
                  <a href="/free-kit" className="bg-ivory/15 text-ivory px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1"><FileText className="w-4 h-4" /> Free 1-page handout</a>
                </div>
              </div>
            )}

            <Disclaimer compact />
          </div>
        </div>
      </div>
    </div>
  );
}
