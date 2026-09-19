import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LogOut, Shield, Trash2, Save } from 'lucide-react';
import supabase from '../lib/supabase';
import { apiGet, apiSend } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';

interface Profile {
  preferred_name?: string;
  display_name?: string;
  age_range?: string;
  onboarding_complete?: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const p = await apiGet<Profile | null>('/api/profile');
        if (p) setProfile(p);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setError('');
    try {
      await apiSend('/api/profile', 'PUT', {
        ...profile,
        onboarding_complete: true,
      });
      setMsg('Preferences saved.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const exportData = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await apiGet('/api/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `breastaware-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Export downloaded to your device.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

    const deleteAll = async () => {
    if (deleteConfirm !== 'DELETE_MY_DATA') {
      setError('Type DELETE_MY_DATA to confirm.');
      return;
    }
    setBusy(true);
    try {
      await apiSend('/api/export', 'DELETE', { confirm: 'DELETE_MY_DATA' });
      // The account no longer exists — sign out locally and return to login.
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings & Privacy"
        subtitle="Control your account preferences and health data. BreastAware treats your information as highly sensitive."
      />

      <div className="rounded-2xl border border-border bg-white p-5 shadow-soft flex gap-3">
        <Shield className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div className="text-sm text-charcoal/75 leading-relaxed">
          <p className="font-medium text-charcoal mb-1">Privacy principles</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Your notes are stored in your account and scoped to your user ID.</li>
            <li>We do not use observations to diagnose or score cancer risk.</li>
            <li>You can export or delete your organizer data at any time.</li>
            <li>Prefer using this app on a device you control; lock your screen.</li>
          </ul>
        </div>
      </div>

      <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-3">
        <h3 className="font-display text-lg">Profile</h3>
        <p className="text-xs text-charcoal/50">{user?.email}</p>
        <div>
          <label className="text-sm font-medium block mb-1">Preferred name</label>
          <input
            className="input-field"
            value={profile.preferred_name || ''}
            onChange={(e) => setProfile({ ...profile, preferred_name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Age range</label>
          <select
            className="input-field"
            value={profile.age_range || ''}
            onChange={(e) => setProfile({ ...profile, age_range: e.target.value })}
          >
            <option value="">Prefer not to say</option>
            <option value="18-29">18–29</option>
            <option value="30-39">30–39</option>
            <option value="40-49">40–49</option>
            <option value="50-59">50–59</option>
            <option value="60-69">60–69</option>
            <option value="70+">70+</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          <Save className="w-4 h-4" />
          Save preferences
        </button>
      </form>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-soft space-y-3">
        <h3 className="font-display text-lg">Export your data</h3>
        <p className="text-sm text-charcoal/65">Download a JSON copy of your BreastAware records for your files or to share selectively with a clinician.</p>
        <button type="button" className="btn-secondary" disabled={busy} onClick={exportData}>
          <Download className="w-4 h-4" />
          Download export
        </button>
      </section>

      <section className="rounded-2xl border border-rose/25 bg-white p-5 shadow-soft space-y-3">
        <h3 className="font-display text-lg text-rose-deep">Delete my data &amp; account</h3>
        <p className="text-sm text-charcoal/65">
          Permanently removes all of your BreastAware records, uploaded documents, and your account. You will be signed
          out and will not be able to sign in with this email again. This cannot be undone. Type{' '}
          <code className="text-xs bg-ivory px-1 rounded">DELETE_MY_DATA</code> to confirm.
        </p>
        <input
          className="input-field"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="DELETE_MY_DATA"
        />
        <button type="button" className="btn-danger" disabled={busy} onClick={deleteAll}>
          <Trash2 className="w-4 h-4" />
          Delete all data
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-soft">
        <button type="button" className="btn-ghost text-charcoal" onClick={signOut}>
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </section>

      {msg && <p className="text-sm text-forest">{msg}</p>}
      {error && <p className="text-sm text-rose-deep" role="alert">{error}</p>}

      <Disclaimer />
    </div>
  );
}
