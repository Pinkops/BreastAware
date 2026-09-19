import { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Heart, Shield } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Disclaimer from '../components/Disclaimer';

export default function Login() {
  const { user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (!loading && user) return <Navigate to="/" replace />;

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (isSignUp) {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage('Account created. You can sign in now.');
        setIsSignUp(false);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-forest items-center justify-center mb-4 shadow-sm">
              <Heart className="w-7 h-7 text-ivory" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl text-charcoal tracking-tight">BreastAware</h1>
            <p className="mt-2 text-sm text-charcoal/65 leading-relaxed max-w-sm mx-auto">
              A private breast-health organizer for adult women in the U.S. Know your normal. Notice changes. Keep a record.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white shadow-soft p-6 sm:p-8">
            <h2 className="font-display text-xl text-charcoal mb-1">
              {isSignUp ? 'Create your private space' : 'Welcome back'}
            </h2>
            <p className="text-sm text-charcoal/55 mb-6">
              Your observations stay in your account. Sign in to continue.
            </p>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1.5">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1.5">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="At least 6 characters"
                />
              </div>

              {error && (
                <div className="text-sm text-rose-deep bg-rose-soft/40 border border-rose/30 rounded-lg px-3 py-2" role="alert">
                  {error}
                </div>
              )}
              {message && (
                <div className="text-sm text-forest bg-forest/8 border border-forest/20 rounded-lg px-3 py-2">{message}</div>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-charcoal/60">
              {isSignUp ? 'Already have an account?' : 'New here?'}
              <button
                type="button"
                className="ml-1.5 text-forest font-medium hover:underline"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setMessage('');
                }}
              >
                {isSignUp ? 'Sign in' : 'Create account'}
              </button>
            </p>

            
          </div>

          <div className="mt-6 flex items-start gap-2 text-xs text-charcoal/50 px-1">
            <Shield className="w-4 h-4 shrink-0 mt-0.5 text-forest/70" />
              <p>Privacy-first by design. Health notes are treated as sensitive personal information.{' '}
              <a href="/privacy" className="underline text-forest">Read our Privacy Policy</a>.
            </p>
          </div>

          <div className="mt-4">
            <Disclaimer compact />
          </div>

          <p className="mt-6 text-center text-xs text-charcoal/40 leading-relaxed px-4">
            After you sign in, the Education Center covers self-awareness topics with links to CDC, ACS, and USPSTF resources.
          </p>
        </div>
      </div>
    </div>
  );
}
