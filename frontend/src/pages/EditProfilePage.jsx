import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageCard from '../components/PageCard';
import { profileApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function EditProfilePage() {
  const { token, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    profileApi
      .get(token)
      .then((data) => {
        setDisplayName(data.displayName || '');
        setBio(data.bio || '');
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await profileApi.update(token, { displayName, bio });
      await refreshMe();
      navigate('/app/profile');
    } catch (err) {
      setError(err.message || 'Unable to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageCard title="Edit Profile">Loading...</PageCard>;
  }

  return (
    <PageCard title="Edit Profile" subtitle="Update your public trainer name and short bio.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm text-white/80">Display name</span>
          <input
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none ring-emerald-300/60 focus:ring"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            minLength={2}
            maxLength={32}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-white/80">Bio</span>
          <textarea
            className="min-h-28 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none ring-emerald-300/60 focus:ring"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={180}
          />
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-velvet-green-600 px-6 py-3 font-semibold hover:bg-velvet-green-500 disabled:opacity-70"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </PageCard>
  );
}
