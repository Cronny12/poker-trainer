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

  const tableView = useMemo(() => {
    if (!game) {
      return null;
    }
    return toTableView(game);
  }, [game]);

  if (!game || !tableView) {
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

  const heroTurn = !game.handComplete && !game.matchComplete && actor?.isHuman;

  return (
    <div className="space-y-5 pb-56">
      <PageCard
        title="6-Max Live Hold'em"
        subtitle="Texas Hold'em simulator with real betting streets, seat markers, and showdown payouts."
        className="overflow-hidden"
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <InfoPill label="Hand" value={`#${game.handNumber}`} />
          <InfoPill label="Street" value={formatStage(game.stage)} />
          <InfoPill label="To Act" value={actor ? actor.name : '—'} />
          <InfoPill label="Current Bet" value={game.currentBet} />
        </div>

        <PokerTableCanvas table={tableView} animationKey={animationKey} />
      </PageCard>

      <PageCard title="Hand Log" subtitle="Most recent table events and outcomes.">
        <div className="max-h-56 space-y-1 overflow-auto text-sm text-white/80">
          {game.actionLog.slice(-20).map((entry, index) => (
            <p key={`${entry}-${index}`}>{entry}</p>
          ))}
        </div>
      </PageCard>

      <div className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl justify-center lg:justify-start">
          <div className="w-full max-w-2xl">
            {heroTurn ? (
              <ActionPanel
                legal={legal}
                onAction={handleAction}
                disabled={false}
                tableState={{ pot: game.pot, currentBet: game.currentBet }}
              />
            ) : (
              <div className="rounded-2xl border border-white/20 bg-[#0d1220]/92 p-4 text-sm text-white/85 shadow-2xl backdrop-blur-xl">
                <p>
                  {game.matchComplete
                    ? 'Match complete. Result is being logged.'
                    : game.handComplete
                      ? 'Hand complete. Deal next hand when ready.'
                      : 'Bots are acting...'}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {game.handComplete && !game.matchComplete ? (
                    <button
                      type="button"
                      onClick={handleNextHand}
                      className="rounded-xl bg-velvet-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-velvet-green-500"
                    >
                      Deal Next Hand
                    </button>
                  ) : null}

                  {game.matchComplete ? (
                    <button
                      type="button"
                      onClick={() => navigate('/app/match')}
                      className="rounded-xl bg-velvet-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-velvet-red-500"
                    >
                      Back To Match Setup
                    </button>
                  ) : null}
                </div>

                {recorded && game.matchComplete ? (
                  <p className="mt-2 text-sm text-emerald-200">Match result logged.</p>
                ) : null}
              </div>
            )}

            {actionError ? <p className="mt-2 text-sm text-rose-300">{actionError}</p> : null}
            {recordingError ? <p className="mt-2 text-sm text-rose-300">{recordingError}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-xl border border-white/15 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function toTableView(game) {
  const showdown = game.stage === 'showdown' || game.handComplete || game.matchComplete;
  const dealerId = game.dealerIndex >= 0 ? game.players[game.dealerIndex]?.id : '';
  const sbId = game.sbIndex >= 0 ? game.players[game.sbIndex]?.id : '';
  const bbId = game.bbIndex >= 0 ? game.players[game.bbIndex]?.id : '';
  const actorId = game.actionIndex >= 0 ? game.players[game.actionIndex]?.id : '';

  const winnerIds = game.lastHandResult?.winnerIds || [];
  const winnerSet = new Set(winnerIds);
  const primaryWinnerId = winnerIds[0] || '';
  const primaryWinner = game.players.find((player) => player.id === primaryWinnerId);

  return {
    pot: game.pot,
    stage: game.stage,
    stageLabel: formatStage(game.stage),
    communityCards: visibleCommunityCards(game, showdown),
    showWinnerOverlay: showdown && winnerIds.length > 0,
    winnerLabel: winnerSet.has('hero') ? 'YOU WIN' : 'WIN',
    winnerSeat: primaryWinner?.seat || 1,
    players: [...game.players]
      .sort((a, b) => a.seat - b.seat)
      .map((player) => ({
        id: player.id,
        seat: player.seat,
        name: player.name,
        stack: player.stack,
        bet: player.currentBet,
        folded: player.folded,
        allIn: player.allIn,
        busted: player.stack <= 0,
        isHero: player.isHuman,
        isDealer: player.id === dealerId,
        isSmallBlind: player.id === sbId,
        isBigBlind: player.id === bbId,
        isTurn: !game.handComplete && player.id === actorId,
        isWinner: winnerSet.has(player.id),
        holeCards: showdown || player.isHuman ? player.holeCards : [null, null],
        cardsHidden: !(showdown || player.isHuman)
      }))
  };
}

function visibleCommunityCards(game, showdown) {
  const full = Array.from({ length: 5 }, (_, index) => game.communityCards[index] || null);

  if (showdown) {
    return full;
  }

  if (game.stage === 'river') {
    return full;
  }

  if (game.stage === 'turn') {
    return full.map((card, index) => (index < 4 ? card : null));
  }

  if (game.stage === 'flop') {
    return full.map((card, index) => (index < 3 ? card : null));
  }

  return full.map(() => null);
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
    return 'Flop';
  }
  if (stage === 'turn') {
    return 'Turn';
  }
  if (stage === 'river') {
    return 'River';
  }
  if (stage === 'showdown') {
    return 'Showdown';
  }
  if (stage === 'match_over') {
    return 'Match Over';
  }
  return stage;
}
