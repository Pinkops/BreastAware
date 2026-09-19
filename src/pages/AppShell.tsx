import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import Layout from '../components/Layout';
import Onboarding from './Onboarding';
import LoadingSpinner from '../components/LoadingSpinner';

interface Profile {
  onboarding_complete?: boolean;
}

export default function AppShell() {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const check = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const p = await apiGet<Profile | null>('/api/profile');
      setNeedsOnboarding(!p || !p.onboarding_complete);
    } catch {
      // BA-025: a network/API failure is NOT the same as "new user".
      // Show a retry screen instead of onboarding, so an existing user's
      // profile can never be accidentally overwritten.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <LoadingSpinner label="Preparing your space…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="font-display text-2xl text-charcoal">We couldn’t reach your space</h1>
          <p className="text-sm text-charcoal/65 leading-relaxed">
            Check your internet connection and try again. Your notes are safe — nothing was changed or deleted.
          </p>
          <button type="button" className="btn-primary" onClick={check}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <Layout />;
}
