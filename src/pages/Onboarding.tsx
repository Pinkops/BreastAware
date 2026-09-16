import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Check } from 'lucide-react';
import { apiSend } from '../lib/api';
import Disclaimer from '../components/Disclaimer';

const steps = [
  {
    title: 'Welcome to BreastAware',
    body: 'This is your private space to understand what is normal for your body, record changes you notice, organize screening history, and prepare for conversations with healthcare professionals.',
  },
  {
    title: 'What this app is — and is not',
    body: 'BreastAware helps with self-awareness and organization. It does not diagnose breast cancer, calculate your personal risk score, or replace mammograms, clinical exams, imaging, or medical advice.',
  },
  {
    title: 'Your principle',
    body: 'Know your normal. Notice changes. Keep a record. Know when to talk to a healthcare professional.',
  },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      await apiSend('/api/profile', 'POST', {
        preferred_name: name.trim() || null,
        display_name: name.trim() || null,
        age_range: ageRange || null,
        onboarding_complete: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      onComplete();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const isLast = step === steps.length;

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center">
            <Heart className="w-5 h-5 text-ivory" />
          </div>
          <span className="font-display text-xl text-charcoal">BreastAware</span>
        </div>

        <div className="rounded-2xl border border-border bg-white shadow-soft p-6 sm:p-8">
          {!isLast ? (
            <>
              <div className="flex gap-1.5 mb-6" aria-hidden>
                {steps.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-forest' : 'bg-border'}`} />
                ))}
              </div>
              <h1 className="font-display text-2xl text-charcoal mb-3">{steps[step].title}</h1>
              <p className="text-charcoal/70 leading-relaxed mb-8">{steps[step].body}</p>
              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={step === 0}
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </button>
                <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)}>
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl text-charcoal mb-2">A few preferences</h1>
              <p className="text-sm text-charcoal/65 mb-6">Optional — helps personalize greetings. You can change this later.</p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="pref-name">What should we call you?</label>
                  <input
                    id="pref-name"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Preferred name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="age-range">Age range (optional)</label>
                  <select id="age-range" className="input-field" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                    <option value="">Prefer not to say</option>
                    <option value="18-29">18–29</option>
                    <option value="30-39">30–39</option>
                    <option value="40-49">40–49</option>
                    <option value="50-59">50–59</option>
                    <option value="60-69">60–69</option>
                    <option value="70+">70+</option>
                  </select>
                </div>
              </div>
              <Disclaimer className="mb-6" />
              {error && <p className="text-sm text-rose-deep mb-3" role="alert">{error}</p>}
              <button type="button" className="btn-primary w-full" disabled={busy} onClick={finish}>
                <Check className="w-4 h-4" />
                {busy ? 'Saving…' : 'Enter BreastAware'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
