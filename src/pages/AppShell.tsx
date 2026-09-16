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

  const check = async () => {
    setLoading(true);
    try {
      const p = await apiGet<Profile | null>('/api/profile');
      setNeedsOnboarding(!p || !p.onboarding_complete);
    } catch {
      setNeedsOnboarding(true);
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

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <Layout />;
}
