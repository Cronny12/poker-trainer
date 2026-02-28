import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageCard from '../components/PageCard';
import { profileApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    profileApi
      .get(token)
      .then(setProfile)
      .catch((err) => setError(err.message || 'Unable to load profile'));
  }, [token]);

  return (
    <PageCard title="Profile" subtitle="Your current poker trainer identity and progress stats.">
      {profile ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Username" value={profile.username} />
            <Stat label="Email" value={profile.email} />
            <Stat label="Display Name" value={profile.displayName} />
            <Stat label="Chip Balance" value={String(profile.chips)} />
            <Stat label="Teaser Streak" value={`${profile.teaserStreak} days`} />
            <Stat label="Record" value={`${profile.wins}W / ${profile.losses}L`} />
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Bio</p>
            <p className="mt-2 text-sm leading-6 text-white/80">{profile.bio || 'No bio set yet.'}</p>
          </div>
          <Link
            to="/app/profile/edit"
            className="inline-block rounded-xl bg-velvet-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-velvet-red-500"
          >
            Edit Profile
          </Link>
        </div>
      ) : (
        <p className="text-sm text-white/70">Loading profile...</p>
      )}

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </PageCard>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
