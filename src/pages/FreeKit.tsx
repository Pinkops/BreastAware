import { Link } from 'react-router-dom';
import { FileText, Download, Heart, CheckCircle2, ClipboardList, BookOpen, MapPin } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Disclaimer from '../components/Disclaimer';

export default function FreeKit() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center">
            <Heart className="w-5 h-5 text-ivory" />
          </div>
          <p className="font-display text-lg">BreastAware</p>
        </div>

        <PageHeader
          title="Free Kit — 10 Questions to Bring to Your Visit"
          subtitle="A 1-page printable handout for your next appointment — with mini body map, what to bring checklist, and QR to track privately. No email required. Private by design."
        />

        <div className="rounded-2xl border border-forest/20 bg-white p-6 shadow-soft space-y-4">
          <h2 className="font-display text-xl">What you get — free, no signup</h2>
          <ul className="space-y-2 text-sm text-charcoal/75">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" /> 10 questions clinicians often ask — with space to write your answers</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" /> Mini body map — left/right, quadrants, clock positions (12/3/6/9)</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" /> What to Bring checklist — ID, insurance, med list, prior reports, this sheet</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" /> QR to BreastAware — private organizer to turn notes into Visit Summary packet</li>
          </ul>

          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <a href="/gumroad-pdfs/Clinician-Handout-Free-1Page.pdf" download className="btn-primary justify-center">
              <Download className="w-4 h-4" /> Download Free PDF
            </a>
            <Link to="/" className="btn-secondary justify-center"><BookOpen className="w-4 h-4" /> Open private app</Link>
            <a href="https://breastaware101.vercel.app/" className="btn-ghost justify-center text-sm">Learn how it works →</a>
          </div>

          <div className="rounded-xl bg-ivory border border-border p-4 text-xs text-charcoal/60 leading-relaxed">
            <p className="font-medium text-charcoal">Why free?</p>
            <p className="mt-1">Most people forget details at appointments. This 1-page sheet helps you arrive visit-ready. If you want the full system — 43 prepared answers, timeline, selective Visit Summary — try the private app. Premium printable kit ($39) available on Gumroad with 43 Qs, body map printable, and doctor questions pack.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-white p-4">
            <ClipboardList className="w-5 h-5 text-forest mb-2" />
            <p className="text-sm font-medium">Record what you notice</p>
            <p className="text-xs text-charcoal/60 mt-1">Date, side, size in your words — timestamped privately</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <MapPin className="w-5 h-5 text-coral mb-2" />
            <p className="text-sm font-medium">Mark location</p>
            <p className="text-xs text-charcoal/60 mt-1">Body Map adds quadrant + clock for precise description</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <FileText className="w-5 h-5 text-forest mb-2" />
            <p className="text-sm font-medium">Generate packet</p>
            <p className="text-xs text-charcoal/60 mt-1">Visit Summary — selective PDF for clinician conversation</p>
          </div>
        </div>

        <Disclaimer />

        <p className="text-center text-xs text-charcoal/40">BreastAware is a private organizer — not a medical device, no diagnosis, no risk scores. For personal notes only.</p>
      </div>
    </div>
  );
}
