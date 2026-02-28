import { useState } from 'react';
import PageCard from '../components/PageCard';
import { chipsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function DailyChipsPage() {
  const { token, refreshMe } = useAuth();
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await chipsApi.claimDaily(token);
      setResult(response);
      await refreshMe();
    } catch (err) {
      setError(err.message || 'Could not claim daily chips');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageCard title="Daily Free Chips" subtitle="Claim once each day. Missed days do not stack.">
      <button
        type="button"
        onClick={handleClaim}
        disabled={submitting}
        className="rounded-xl bg-velvet-green-600 px-6 py-3 font-semibold transition hover:bg-velvet-green-500 disabled:opacity-70"
      >
        {submitting ? 'Claiming...' : 'Claim Daily Chips'}
      </button>

      {result ? (
        <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
          <p className="text-sm text-emerald-100">{result.message}</p>
          <p className="mt-2 text-lg font-semibold">Awarded: {result.awarded} chips</p>
          <p className="text-sm text-white/80">Current balance: {result.chips}</p>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </PageCard>
  );
}
