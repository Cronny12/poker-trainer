import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageCard from '../components/PageCard';
import { matchApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const seats = [2, 3, 4, 5, 6];
const MATCH_SETUP_KEY = 'poker_trainer_match_setup';

export default function MatchPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState([]);
  const [history, setHistory] = useState([]);
  const [assignments, setAssignments] = useState(() =>
    seats.reduce((acc, seat) => {
      acc[seat] = '';
      return acc;
    }, {})
  );
  const [randomizeUnassigned, setRandomizeUnassigned] = useState(true);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
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

  const strategyById = useMemo(() => {
    const mapping = new Map();
    strategies.forEach((strategy) => mapping.set(strategy.id, strategy));
    return mapping;
  }, [strategies]);

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

  const randomStrategyId = () => {
    if (!strategies.length) {
      return 'balanced-grinder';
    }
    const index = Math.floor(Math.random() * strategies.length);
    return strategies[index].id;
  };

  const handleStartMatch = () => {
    setStarting(true);
    setError('');

    try {
      const lineup = seats.map((seat) => {
        const selectedId = assignments[seat];
        const strategyId =
          selectedId || (randomizeUnassigned ? randomStrategyId() : 'balanced-grinder');

        const strategy =
          strategyById.get(strategyId) || strategyById.get('balanced-grinder') || strategies[0];

        if (!strategy) {
          throw new Error('No bot strategies available.');
        }

        return {
          seat,
          strategyId: strategy.id,
          strategyName: strategy.name
        };
      });

      sessionStorage.setItem(MATCH_SETUP_KEY, JSON.stringify({ lineup }));
      navigate('/app/match/table', { state: { lineup } });
    } catch (err) {
      setError(err.message || 'Could not start match table');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <PageCard title="Bot Match Builder">Loading match setup...</PageCard>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <PageCard
        title="Start 6-Max Bot Match"
        subtitle="6 seats total: you + 5 bots. Choose each bot strategy, then launch the live table."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/20 px-3 py-1 text-sm">Manual bots selected: {selectedCount}/5</span>
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
          disabled={starting}
          className="mt-5 rounded-xl bg-velvet-green-600 px-6 py-3 font-semibold hover:bg-velvet-green-500 disabled:opacity-70"
        >
          {starting ? 'Launching table...' : 'Start Match'}
        </button>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </PageCard>

      <PageCard title="Match History" subtitle="Logged after full table result (you bust or you win).">
        {history.length === 0 ? (
          <p className="text-sm text-white/70">No completed matches yet.</p>
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
