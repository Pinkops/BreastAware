export default function Privacy() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <a href="/" className="text-sm text-forest underline">&larr; Back to BreastAware</a>

        <h1 className="font-display text-3xl text-charcoal mt-4">Privacy Policy</h1>
        <p className="text-sm text-charcoal/55 mt-1">Effective date: September 19, 2026 — Updated for Visit-Ready System (MOVE 10)</p>

        <div className="mt-6 space-y-6 text-sm text-charcoal/80 leading-relaxed">
          <section className="rounded-2xl border-2 border-forest/20 bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">STOP / USE — Plain language promise</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <div className="rounded-xl bg-rose-soft/30 border border-rose/20 p-3">
                <p className="font-semibold text-rose-deep text-xs uppercase tracking-wide">STOP — We do NOT</p>
                <ul className="mt-2 list-disc pl-4 space-y-1 text-xs">
                  <li>Calculate your cancer risk or score</li>
                  <li>Diagnose, rule out cancer, or tell you what a change means</li>
                  <li>Recommend screening intervals</li>
                  <li>Sell your data, show ads, or use trackers/analytics</li>
                  <li>Share health notes with insurers, employers, advertisers</li>
                  <li>Collect location, contacts, or data from other apps</li>
                </ul>
              </div>
              <div className="rounded-xl bg-forest/8 border border-forest/20 p-3">
                <p className="font-semibold text-forest text-xs uppercase tracking-wide">USE — We DO use your data to</p>
                <ul className="mt-2 list-disc pl-4 space-y-1 text-xs">
                  <li>Show your own records back to you (timeline, journal)</li>
                  <li>Generate Visit Summary packet you choose to share with clinician</li>
                  <li>Store private docs in Health Vault with 10-min signed links</li>
                  <li>Let you export / delete everything in Settings</li>
                  <li>Send account emails (signup, reset) via Gmail</li>
                  <li>Keep service secure (RLS, HTTPS, private bucket)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Who we are</h2>
            <p className="mt-2">
              BreastAware is a private, personal breast-health organizer — a system for turning observations into organized info for healthcare conversations. Not a medical device, does not diagnose, never replaces professional care. Category: Private Breast Health Record & Visit Preparation.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">What information we collect</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> email + encrypted password</li>
              <li><strong>Profile data:</strong> preferred name, age range, is_premium flag if you redeem Premium Kit</li>
              <li><strong>Health notes you choose to record:</strong> observations, check-ins, body-map markers, screening/appointment records, doctor prep, visit readiness answers, health & family history notes</li>
              <li><strong>Documents you upload:</strong> files in Vault (PDF, PNG, JPG, WEBP up to 10 MB via direct-to-storage)</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Service providers</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — stores account, records, Vault files (private bucket ba-vault, direct-to-storage upload)</li>
              <li><strong>Vercel</strong> — hosts site + API (single [resource].js dispatcher, rate limited)</li>
              <li><strong>Google (Gmail)</strong> — delivers account emails</li>
              <li><strong>Gumroad (optional)</strong> — verifies license keys server-side via https://api.gumroad.com/v2/licenses/verify</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Your choices and rights</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> Export all data (Settings → Export)</li>
              <li><strong>Correction:</strong> Edit/delete any record in app</li>
              <li><strong>Deletion:</strong> Delete all data + account (Settings → Delete)</li>
              <li><strong>Premium:</strong> Redeem via /redeem with Gumroad license or bonus code BA-PREMIUM-2026</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Medical and legal notes</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>General educational info only. Not medical advice, diagnosis, treatment.</li>
              <li>Always consult qualified health professional.</li>
              <li>Not a HIPAA-covered medical record system.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Contact</h2>
            <p className="mt-2">Questions? Email <a href="mailto:beyondpinkops@protonmail.com" className="text-forest underline">beyondpinkops@protonmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
