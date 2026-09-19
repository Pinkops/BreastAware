export default function Privacy() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <a href="/" className="text-sm text-forest underline">&larr; Back to BreastAware</a>

        <h1 className="font-display text-3xl text-charcoal mt-4">Privacy Policy</h1>
        <p className="text-sm text-charcoal/55 mt-1">Effective date: September 19, 2026</p>

        <div className="mt-6 space-y-6 text-sm text-charcoal/80 leading-relaxed">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Who we are</h2>
            <p className="mt-2">
              BreastAware is a private, personal breast-health organizer. It helps you track observations,
              check-ins, screening history, and prepare questions for your doctor. BreastAware is an
              educational and organizational tool. It is not a medical device, does not diagnose anything,
              and never replaces professional medical care.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">What information we collect</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> your email address and an encrypted password (used only for signing in).</li>
              <li><strong>Profile data:</strong> information you enter during setup, such as your age range.</li>
              <li><strong>Health notes you choose to record:</strong> observations, cycle check-ins, body-map notes,
                screening records, doctor-visit prep notes, and risk notes.</li>
              <li><strong>Documents you upload:</strong> files you add to your Vault (for example PDFs or images of
                reports). Uploads are optional.</li>
            </ul>
            <p className="mt-2">
              Everything above is entered by you, voluntarily. If you do not enter it, we do not have it.
              We do not collect location data, contacts, or data from other apps.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">How we use your information</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>To provide your personal organizer and show your own records back to you.</li>
              <li>To send account emails (sign-up confirmation and password resets).</li>
              <li>To keep the service secure and prevent unauthorized access.</li>
            </ul>
            <p className="mt-2">
              <strong>We do not</strong> sell your data, show advertisements, share your health notes with
              advertisers, insurers, or employers, or use third-party analytics or tracking scripts.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Service providers</h2>
            <p className="mt-2">We use a small number of trusted providers to operate the app:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — securely stores your account, records, and Vault files (cloud infrastructure operated by Amazon Web Services).</li>
              <li><strong>Vercel</strong> — hosts the BreastAware website and its application programming interface (API).</li>
              <li><strong>Google (Gmail)</strong> — delivers account-related emails such as sign-up confirmations.</li>
            </ul>
            <p className="mt-2">
              These providers process data only to run the service. They are not given rights to use your
              health notes for their own purposes.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">How we protect your data</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>All traffic is encrypted in transit (HTTPS/TLS).</li>
              <li>Database rules enforce that each signed-in user can access only their own records.</li>
              <li>Vault documents are stored in private storage and can only be opened through short-lived,
                signed links issued to the signed-in owner.</li>
              <li>Server-side checks validate and limit what can be written to your records.</li>
            </ul>
            <p className="mt-2">
              No system can promise perfect security. We take reasonable technical and organizational
              measures, and we treat your health notes as sensitive personal information.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Your choices and rights</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> export all of your data anytime (Settings &rarr; Export my data).</li>
              <li><strong>Correction:</strong> edit or delete any record inside the app.</li>
              <li><strong>Deletion:</strong> permanently delete all of your data and your account
                (Settings &rarr; Delete my data &amp; account). This cannot be undone.</li>
            </ul>
            <p className="mt-2">
              Depending on where you live, you may have additional privacy rights (for example under the
              Philippine Data Privacy Act, the GDPR, or similar laws). To exercise any right, contact us at
              the address below and we will respond within a reasonable time.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Data retention</h2>
            <p className="mt-2">
              We keep your data for as long as your account exists. When you delete your account, your
              records, uploaded documents, and login credentials are removed.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Age</h2>
            <p className="mt-2">
              BreastAware is intended for adults aged 18 and over. We do not knowingly collect data from
              children.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Medical and legal notes</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>BreastAware provides general educational information only. It does not provide medical
                advice, diagnosis, or treatment.</li>
              <li>Always consult a qualified health professional about breast changes, screening, or any
                health concern. If you notice a new or changing lump or other concern, contact a clinician
                promptly.</li>
              <li>BreastAware is not a healthcare provider, and this service is not a medical record system
                covered by HIPAA. Do not upload records you are not comfortable storing in a personal
                organizer.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy as the service evolves. Material changes will be reflected on this
              page with a new effective date.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <h2 className="font-display text-lg text-charcoal">Contact</h2>
            <p className="mt-2">
              Questions about privacy or your data? Email us at{' '}
              <a href="mailto:beyondpinkops@protonmail.com" className="text-forest underline">
                beyondpinkops@protonmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
