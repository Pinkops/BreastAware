import { Link } from 'react-router-dom';
import { Heart, Download, ArrowRight, CheckCircle2, FileText, Shield, ExternalLink } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Disclaimer from '../components/Disclaimer';

export default function FreeKit() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center">
            <Heart className="w-5 h-5 text-ivory" />
          </div>
          <div>
            <p className="font-display text-lg leading-none">BreastAware</p>
            <p className="text-[11px] text-charcoal/60 uppercase tracking-wide">Free 1-page handout • No diagnosis</p>
          </div>
        </div>

        <PageHeader
          title="Free Kit — 10 Questions to Ask at Your Visit"
          subtitle="1-page printable handout you can bring to any clinic. No email required. Private. Does not diagnose or calculate risk."
        />

        <div className="rounded-2xl border border-border bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-sm text-charcoal/70">
            <FileText className="w-4 h-4 text-forest" />
            <span>File served from public/ — direct download, not via API — fixes empty index.html bug</span>
          </div>

          <h3 className="font-display text-xl">What you get free:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest mt-0.5" /> 10 clinician-tested questions to ask at visit</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest mt-0.5" /> Quadrant + clock location guide</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest mt-0.5" /> What to bring checklist (ID, meds, prior imaging)</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest mt-0.5" /> No diagnosis, no risk score, no email gate — print and bring</li>
          </ul>

          <a
            href="/Clinician-Handout-Free-1Page.pdf"
            download="BreastAware-Free-Kit-10-Questions.pdf"
            className="btn-primary w-full justify-center"
          >
            <Download className="w-4 h-4" /> Download Free PDF (1-page, ~4KB)
          </a>

          <p className="text-[11px] text-charcoal/45">
            Direct link: <code>/Clinician-Handout-Free-1Page.pdf</code> — served from <code>public/</code>. If you previously uploaded to <code>gumroad-pdfs/</code>, Vercel returns index.html fallback — this fix corrects that.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/starter" className="btn-secondary text-sm"><ArrowRight className="w-4 h-4" /> Try free PWA summary generator →</Link>
            <Link to="/" className="btn-secondary text-sm"><Heart className="w-4 h-4" /> Full private app</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-forest/20 bg-forest text-ivory p-5 space-y-3">
          <h3 className="font-display text-lg">Want the full premium kit $39?</h3>
          <p className="text-sm text-ivory/80">43 questions, visit readiness checklist, body map worksheet, timeline template, vault upload guide — printable ZIP 15KB + is_premium flag via redeem code BA-PREMIUM-2026.</p>
          <a href="https://pinkops.gumroad.com/l/breastaware-premium" target="_blank" rel="noopener" className="bg-ivory text-forest px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1">
            Get Premium Kit on Gumroad <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="rounded-xl bg-white border border-border p-4 flex gap-2 text-xs text-charcoal/60">
          <Shield className="w-4 h-4 text-forest mt-0.5" />
          <p>BreastAware is private organizer — does not diagnose, does not rule out cancer, does not replace screening. For educational notes only. Bring official imaging reports as source of truth.</p>
        </div>

        <Disclaimer compact />
      </div>
    </div>
  );
}
