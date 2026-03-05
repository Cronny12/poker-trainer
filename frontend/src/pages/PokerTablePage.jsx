import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ActionPanel from '../components/ActionPanel';
import PokerTableCanvas from '../components/PokerTableCanvas';
import PageCard from '../components/PageCard';
import { useAuth } from '../context/AuthContext';
import {
  advanceToNextHand,
  applyPlayerAction,
  createMatch,
  getLegalActions
} from '../game/engine';
import { matchApi } from '../api/services';

const MATCH_SETUP_KEY = 'poker_trainer_match_setup';
const SIX_MAX_SEATS = [2, 3, 4, 5, 6];

const STYLE_MAP = {
  'tight-aggressive': { style: 'Tight', difficulty: 'Hard' },
  'loose-aggressive': { style: 'Aggressive', difficulty: 'Hard' },
  'calling-station': { style: 'Loose', difficulty: 'Easy' },
  nit: { style: 'Tight', difficulty: 'Medium' },
  'balanced-grinder': { style: 'Balanced', difficulty: 'Medium' },
  maniac: { style: 'Aggressive', difficulty: 'Medium' },
  'tricky-trapper': { style: 'Balanced', difficulty: 'Hard' },
  'gto-lite': { style: 'Balanced', difficulty: 'Hard' },
  'passive-recreational': { style: 'Loose', difficulty: 'Easy' },
  'icm-aware': { style: 'Tight', difficulty: 'Hard' }
};

export default function PokerTablePage() {
  const { token, refreshMe } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const lineup = useMemo(() => {
    const fromState = location.state?.lineup;
    if (Array.isArray(fromState) && fromState.length) {
      return normalizeLineup(fromState);
    }

    const fromStorage = sessionStorage.getItem(MATCH_SETUP_KEY);
    if (!fromStorage) {
      return [];
    }

    try {
      const parsed = JSON.parse(fromStorage);
      return normalizeLineup(parsed.lineup || []);
    } catch {
      return [];
    }
  }, [location.state]);

  const [game, setGame] = useState(null);
  const [recorded, setRecorded] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!lineup.length) {
      navigate('/app/match', { replace: true });
      return;
    }

    const bots = lineup.map((bot, index) => {
      const mapped = STYLE_MAP[bot.strategyId] || { style: 'Balanced', difficulty: 'Medium' };
      return {
        seat: bot.seat,
        name: `Bot ${index + 1}`,
        style: mapped.style,
        difficulty: mapped.difficulty
      };
    });

    const config = {
      numBots: 5,
      startingStack: 2000,
      smallBlind: 10,
      bigBlind: 20,
      seed: Date.now(),
      bots
    };

    setGame(createMatch(config));
    setRecorded(false);
    setRecordingError('');
    setActionError('');
  }, [lineup, navigate]);

  useEffect(() => {
    if (!game?.matchComplete || recorded || !lineup.length) {
      return;
    }

    let mounted = true;
    setRecordingError('');

    matchApi
      .recordResult(token, {
        userWon: game.winnerId === 'hero',
        botStrategies: lineup.map((bot) => bot.strategyName)
      })
      .then(() => refreshMe())
      .then(() => {
        if (mounted) {
          setRecorded(true);
        }
      })
      .catch((error) => {
        if (mounted) {
          setRecordingError(error.message || 'Could not record match result.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [game, recorded, lineup, token, refreshMe]);

  const actor = game?.actionIndex >= 0 ? game.players[game.actionIndex] : null;

  const legal = useMemo(() => {
    if (!game || game.handComplete || game.matchComplete || !actor?.isHuman) {
      return {
        available: [],
        toCall: 0,
        minBetTo: 0,
        maxBetTo: 0,
        minRaiseTo: 0,
        maxRaiseTo: 0
      };
    }

    return getLegalActions(game, game.actionIndex);
  }, [game, actor]);

  const animationKey = useMemo(() => {
    if (!game) {
      return 'loading';
    }
    return `${game.handNumber}-${game.stage}-${game.pot}-${game.communityCards.length}`;
  }, [game]);

  if (!game) {
    return <PageCard title="Poker Table">Loading live table...</PageCard>;
  }

  const handleAction = (action) => {
    setActionError('');
    try {
      setGame((previous) => applyPlayerAction(previous, action));
    } catch (error) {
      setActionError(error.message || 'Action rejected by engine.');
    }
  };

  const handleNextHand = () => {
    setGame((previous) => advanceToNextHand(previous));
    setActionError('');
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="6-Max Live Hold'em Table"
        subtitle="Clean table view inspired by modern online poker layouts. Play until you bust or win."
        className="poker-table-page-card"
      >
        <div className="table-layout">
          <aside className="action-sidebar">
            <div className="action-sidebar-inner">
              <div className="space-y-3 rounded-2xl border border-white/12 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">Table State</p>
                <p className="text-sm text-white/80">Hand #{game.handNumber}</p>
                <p className="text-sm text-white/80">Stage: {formatStage(game.stage)}</p>
                <p className="text-base font-semibold text-amber-100">Pot: {game.pot}</p>
                <p className="text-sm text-white/80">Current Bet: {game.currentBet}</p>
                <p className="text-sm text-white/80">Min Raise: {game.minRaise}</p>
                <p className="text-sm text-white/80">Acting: {actor ? actor.name : '—'}</p>
                {game.matchComplete ? (
                  <p className="pt-1 text-sm font-semibold text-emerald-100">
                    Match winner: {game.players.find((player) => player.id === game.winnerId)?.name || 'Unknown'}
                  </p>
                ) : null}
              </div>

              {!game.handComplete && actor?.isHuman ? (
                <ActionPanel legal={legal} onAction={handleAction} disabled={false} />
              ) : (
                <div className="rounded-2xl border border-white/15 bg-black/30 p-4 text-sm text-white/75">
                  {game.matchComplete
                    ? 'Match complete. Result is being logged.'
                    : game.handComplete
                      ? 'Hand complete. Deal next hand when ready.'
                      : 'Bots are acting...'}
                </div>
              )}

              {game.handComplete && !game.matchComplete ? (
                <button
                  type="button"
                  onClick={handleNextHand}
                  className="w-full rounded-xl bg-velvet-green-600 px-4 py-3 text-sm font-semibold hover:bg-velvet-green-500"
                >
                  Deal Next Hand
                </button>
              ) : null}

              {game.matchComplete ? (
                <button
                  type="button"
                  onClick={() => navigate('/app/match')}
                  className="w-full rounded-xl bg-velvet-red-600 px-4 py-3 text-sm font-semibold hover:bg-velvet-red-500"
                >
                  Back To Match Setup
                </button>
              ) : null}

              {actionError ? <p className="text-sm text-rose-300">{actionError}</p> : null}
              {recordingError ? <p className="text-sm text-rose-300">{recordingError}</p> : null}
              {recorded && game.matchComplete ? (
                <p className="text-sm text-emerald-200">Match result logged.</p>
              ) : null}
            </div>
          </aside>

          <div className="table-board-panel">
            <PokerTableCanvas game={game} animationKey={animationKey} />
          </div>
        </div>
      </PageCard>

      <PageCard title="Hand Log" subtitle="Recent hand events.">
        <div className="max-h-56 space-y-1 overflow-auto text-sm text-white/80">
          {game.actionLog.slice(-20).map((entry, index) => (
            <p key={`${entry}-${index}`}>{entry}</p>
          ))}
        </div>
      </PageCard>
    </div>
  );
}

function normalizeLineup(input) {
  const filtered = Array.isArray(input)
    ? input
        .filter((bot) => typeof bot?.seat === 'number' && bot.seat >= 2 && bot.seat <= 6)
        .sort((a, b) => a.seat - b.seat)
    : [];

  const bySeat = new Map(filtered.map((bot) => [bot.seat, bot]));

  return SIX_MAX_SEATS.map((seat) => {
    const bot = bySeat.get(seat);
    if (bot) {
      return bot;
    }

    return {
      seat,
      strategyId: 'balanced-grinder',
      strategyName: 'Balanced Grinder'
    };
  });
}

function formatStage(stage) {
  if (stage === 'preflop') {
    return 'Preflop';
  }
  if (stage === 'flop') {
    return 'Flop (Post-Flop)';
  }
  if (stage === 'turn') {
    return 'Turn (Post-Flop)';
  }
  if (stage === 'river') {
    return 'River (Final Betting)';
  }
  if (stage === 'showdown') {
    return 'Showdown';
  }
  if (stage === 'match_over') {
    return 'Match Over';
  }
  return stage;
}
