import { useEffect, useMemo, useState } from 'react';
import PageCard from '../components/PageCard';
import { matchApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const seats = [2, 3, 4, 5, 6, 7, 8, 9];

export default function MatchPage() {
  const { token, refreshMe } = useAuth();
  const [strategies, setStrategies] = useState([]);
  const [history, setHistory] = useState([]);
  const [assignments, setAssignments] = useState(() =>
    seats.reduce((acc, seat) => {
      acc[seat] = '';
      return acc;
    }, {})
  );
  const [randomizeUnassigned, setRandomizeUnassigned] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([matchApi.strategies(), matchApi.history(token)])
      .then(([strategyResponse, historyResponse]) => {
        setStrategies(strategyResponse);
        setHistory(historyResponse);
      })
      .catch((err) => setError(err.message || 'Failed to load match setup'))
      .finally(() => setLoading(false));
  }, [token]);

  const selectedCount = useMemo(
    () => Object.values(assignments).filter((strategyId) => Boolean(strategyId)).length,
    [assignments]
  );

  const handleAssignmentChange = (seat, strategyId) => {
    setAssignments((prev) => ({ ...prev, [seat]: strategyId }));
  };

  const handleRandomAll = () => {
    setAssignments(
      seats.reduce((acc, seat) => {
        acc[seat] = '';
        return acc;
      }, {})
    );
    setRandomizeUnassigned(true);
  };

  const handleStartMatch = async () => {
    setSubmitting(true);
    setError('');

    const botAssignments = seats
      .filter((seat) => assignments[seat])
      .map((seat) => ({ seat, strategyId: assignments[seat] }));

    try {
      const response = await matchApi.start(token, {
        botAssignments,
        randomizeUnassigned
      });

      setResult(response);
      const nextHistory = await matchApi.history(token);
      setHistory(nextHistory);
      await refreshMe();
    } catch (err) {
      setError(err.message || 'Could not start match');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageCard title="Bot Match Builder">Loading match setup...</PageCard>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <PageCard
        title="Start Bot Match"
        subtitle="9-max table: you + 8 bots. Choose each seat strategy or randomize the remaining seats."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/20 px-3 py-1 text-sm">Manual bots selected: {selectedCount}/8</span>
          <button
            type="button"
            onClick={handleRandomAll}
            className="rounded-full border border-velvet-red-500/45 bg-velvet-red-600/20 px-4 py-1.5 text-sm font-semibold hover:bg-velvet-red-600/35"
          >
            Randomize all bots
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {seats.map((seat) => (
            <label key={seat} className="rounded-xl border border-white/15 bg-white/5 p-3">
              <span className="mb-2 block text-sm text-white/75">Bot Seat {seat}</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm"
                value={assignments[seat]}
                onChange={(event) => handleAssignmentChange(seat, event.target.value)}
              >
                <option value="">Random</option>
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm text-white/85">
          <input
            type="checkbox"
            checked={randomizeUnassigned}
            onChange={(event) => setRandomizeUnassigned(event.target.checked)}
            className="size-4 accent-emerald-500"
          />
          Fill unassigned seats with randomized strategies
        </label>

        <button
          type="button"
          onClick={handleStartMatch}
          disabled={submitting}
          className="mt-5 rounded-xl bg-velvet-green-600 px-6 py-3 font-semibold hover:bg-velvet-green-500 disabled:opacity-70"
        >
          {submitting ? 'Running match simulation...' : 'Start Match'}
        </button>

        {result ? (
          <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-4">
            <p className="font-semibold">{result.summary}</p>
            <p className="mt-2 text-sm">Result: {result.userWon ? 'Win' : 'Loss'}</p>
            <p className="text-sm">Record: {result.wins}W / {result.losses}L</p>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </PageCard>

      <PageCard title="Match History" subtitle="Training games do not reduce chip balance.">
        {history.length === 0 ? (
          <p className="text-sm text-white/70">No matches yet. Start one to build your record.</p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 10).map((match, index) => (
              <article key={`${match.playedAt}-${index}`} className="rounded-lg border border-white/15 bg-white/5 p-3">
                <p className="font-semibold text-sm">{match.userWon ? 'Win' : 'Loss'}</p>
                <p className="mt-1 text-xs text-white/70">{new Date(match.playedAt).toLocaleString()}</p>
                <p className="mt-2 text-xs text-white/75">Bots: {match.botStrategies.join(', ')}</p>
              </article>
            ))}
          </div>
        )}
      </PageCard>
    </div>
  );
}
