import { useEffect, useState } from 'react';
import PageCard from '../components/PageCard';
import { teaserApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

export default function BrainTeaserPage() {
  const { token, refreshMe } = useAuth();
  const [teaser, setTeaser] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    teaserApi
      .today(token)
      .then(setTeaser)
      .catch((err) => setError(err.message || 'Failed to load teaser'));
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await teaserApi.submit(token, answer);
      setResult(response);
      setTeaser((prev) => (prev ? { ...prev, canSubmit: false, currentStreak: response.streak } : prev));
      await refreshMe();
    } catch (err) {
      setError(err.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageCard
      title="Daily Brain Teaser"
      subtitle="One submission per day. Correct answers increase your streak and reward multiplier."
    >
      {teaser ? (
        <>
          <div className="rounded-xl border border-white/15 bg-white/5 p-5">
            <p className="text-sm text-white/60">Question of the day</p>
            <p className="mt-2 text-xl font-semibold leading-8">{teaser.question}</p>
            <p className="mt-3 text-sm text-emerald-100/80">Hint: {teaser.hint}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-white/20 px-3 py-1">Current streak: {teaser.currentStreak}</span>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1">
              Projected reward: {teaser.projectedReward} chips
            </span>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={!teaser.canSubmit || submitting}
              placeholder="Type your answer"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none ring-emerald-300/60 focus:ring disabled:opacity-70"
              required
            />
            <button
              type="submit"
              disabled={!teaser.canSubmit || submitting}
              className="rounded-xl bg-velvet-red-600 px-6 py-3 font-semibold hover:bg-velvet-red-500 disabled:opacity-70"
            >
              {submitting ? 'Checking...' : teaser.canSubmit ? 'Submit Answer' : 'Already Submitted Today'}
            </button>
          </form>
        </>
      ) : (
        <p className="text-sm text-white/70">Loading teaser...</p>
      )}

      {result ? (
        <div
          className={`mt-5 rounded-xl border p-4 ${
            result.correct ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-rose-400/40 bg-rose-500/10'
          }`}
        >
          <p className="font-semibold">{result.message}</p>
          <p className="mt-2 text-sm">Streak: {result.streak}</p>
          <p className="text-sm">Awarded: {result.awarded} chips</p>
          <p className="text-sm">Balance: {result.chips}</p>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </PageCard>
  );
}
