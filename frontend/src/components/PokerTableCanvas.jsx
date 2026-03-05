import { useMemo } from 'react';
import { formatCard } from '../game/engine';

const SEAT_LAYOUT = {
  1: { seat: { x: 50, y: 88 }, cards: { x: 50, y: 73 }, labelAlign: 'center' },
  2: { seat: { x: 18, y: 74 }, cards: { x: 26, y: 64 }, labelAlign: 'left' },
  3: { seat: { x: 12, y: 44 }, cards: { x: 22, y: 44 }, labelAlign: 'left' },
  4: { seat: { x: 50, y: 16 }, cards: { x: 50, y: 26 }, labelAlign: 'center' },
  5: { seat: { x: 88, y: 44 }, cards: { x: 78, y: 44 }, labelAlign: 'right' },
  6: { seat: { x: 82, y: 74 }, cards: { x: 74, y: 64 }, labelAlign: 'right' }
};

export default function PokerTableCanvas({ game, animationKey }) {
  const players = useMemo(() => [...game.players].sort((a, b) => a.seat - b.seat), [game.players]);
  const shownCommunity = visibleCommunityCount(game.stage, game.handComplete, game.matchComplete);
  const showdown = game.stage === 'showdown' || game.handComplete || game.matchComplete;

  return (
    <div className="table-shell">
      <div className="table-outer">
        <div className="table-felt" />

        <div className="table-center">
          <p className="table-pot">POT {game.pot}</p>
          <p className="table-stage">{formatStage(game.stage)}</p>

          <div className="community-row">
            {Array.from({ length: 5 }).map((_, index) => {
              const card = game.communityCards[index];
              const visible = index < shownCommunity && card;
              return (
                <Card
                  key={`community-${index}`}
                  card={visible ? card : null}
                  back={false}
                  revealKey={`${animationKey}-community-${index}`}
                  delay={index * 70}
                  placeholder={!visible}
                />
              );
            })}
          </div>
        </div>

        {players.map((player) => {
          const layout = SEAT_LAYOUT[player.seat] || SEAT_LAYOUT[1];
          const isDealer = game.dealerIndex >= 0 && game.players[game.dealerIndex]?.id === player.id;
          const isSb = game.sbIndex >= 0 && game.players[game.sbIndex]?.id === player.id;
          const isBb = game.bbIndex >= 0 && game.players[game.bbIndex]?.id === player.id;
          const isActing = game.actionIndex >= 0 && game.players[game.actionIndex]?.id === player.id;
          const folded = player.folded;
          const busted = player.stack <= 0;
          const revealCards = player.isHuman || showdown;

          return (
            <div
              key={player.id}
              className={`seat ${isActing ? 'is-acting' : ''} ${busted ? 'is-busted' : ''}`}
              style={{ left: `${layout.seat.x}%`, top: `${layout.seat.y}%` }}
            >
              <div className={`seat-box align-${layout.labelAlign}`}>
                <div className="seat-name-row">
                  <span className="seat-name">{player.name}</span>
                  {isDealer ? <span className="marker marker-dealer">D</span> : null}
                  {isSb ? <span className="marker marker-sb">SB</span> : null}
                  {isBb ? <span className="marker marker-bb">BB</span> : null}
                </div>
                <p className="seat-stack">Stack: {player.stack}</p>
                <p className="seat-bet">Bet: {player.currentBet}</p>
                <p className="seat-state">{busted ? 'Busted' : folded ? 'Folded' : player.allIn ? 'All-in' : 'Active'}</p>
              </div>

              <div
                className={`hole-row align-${layout.labelAlign} ${folded ? 'is-folded' : ''}`}
                style={{ left: `${layout.cards.x - layout.seat.x}%`, top: `${layout.cards.y - layout.seat.y}%` }}
              >
                <Card
                  card={revealCards ? player.holeCards?.[0] : null}
                  back={!revealCards && Boolean(player.holeCards?.[0])}
                  revealKey={`${animationKey}-${player.id}-0`}
                  delay={0}
                />
                <Card
                  card={revealCards ? player.holeCards?.[1] : null}
                  back={!revealCards && Boolean(player.holeCards?.[1])}
                  revealKey={`${animationKey}-${player.id}-1`}
                  delay={80}
                />
              </div>

              {player.currentBet > 0 ? (
                <div className="bet-chip">{player.currentBet}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ card, back, revealKey, delay, placeholder = false }) {
  const style = {
    animationDelay: `${delay}ms`
  };

  if (placeholder) {
    return <div className="card card-placeholder" />;
  }

  if (!card && !back) {
    return <div className="card card-hidden" />;
  }

  if (back) {
    return (
      <div key={revealKey} className="card card-back deal-in" style={style}>
        <div className="card-back-inner" />
      </div>
    );
  }

  if (!card) {
    return <div className="card card-hidden" />;
  }

  const rank = card[0] === 'T' ? '10' : card[0];
  const suit = suitSymbol(card[1]);
  const red = card[1] === 'h' || card[1] === 'd';

  return (
    <div key={revealKey} className="card card-face deal-in" style={style}>
      <span className={`card-corner ${red ? 'red' : 'black'}`}>
        {rank}
        <br />
        {suit}
      </span>
      <span className={`card-center ${red ? 'red' : 'black'}`}>{formatCard(card).replace(rank, '').trim() || suit}</span>
    </div>
  );
}

function suitSymbol(suit) {
  if (suit === 's') {
    return '♠';
  }
  if (suit === 'h') {
    return '♥';
  }
  if (suit === 'd') {
    return '♦';
  }
  return '♣';
}

function visibleCommunityCount(stage, handComplete, matchComplete) {
  if (handComplete || matchComplete || stage === 'showdown') {
    return 5;
  }
  if (stage === 'river') {
    return 5;
  }
  if (stage === 'turn') {
    return 4;
  }
  if (stage === 'flop') {
    return 3;
  }
  return 0;
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
