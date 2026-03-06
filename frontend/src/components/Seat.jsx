import Card from './Card';
import ChipBet from './ChipBet';

export default function Seat({
  player,
  layout,
  animationKey,
  heroTimerProgress = 1,
  heroHandName = ''
}) {
  const activeTone = player.isTurn ? 'ring-2 ring-emerald-300 shadow-[0_0_28px_rgba(74,222,128,0.45)]' : '';
  const winnerTone = player.isWinner ? 'ring-2 ring-amber-300/80 shadow-[0_0_26px_rgba(251,191,36,0.35)]' : '';

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${layout.seat.x}%`, top: `${layout.seat.y}%` }}
    >
      <div className="relative flex flex-col items-center">
        <div className={`relative h-16 w-16 rounded-full border-2 border-white/45 bg-[radial-gradient(circle_at_35%_30%,#586272,#1c2330)] shadow-[0_10px_28px_rgba(0,0,0,0.65)] ${activeTone} ${winnerTone}`}>
          <div className="absolute inset-[4px] rounded-full bg-[radial-gradient(circle_at_30%_20%,#3f4b61,#141b27)]" />
          <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-white/85">
            {player.name.slice(0, 1).toUpperCase()}
          </div>

          {player.isDealer ? (
            <span className="absolute -bottom-1 -left-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-100/60 bg-amber-300 text-[11px] font-black text-slate-900 shadow-[0_3px_12px_rgba(0,0,0,0.45)]">
              D
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 min-w-[106px] rounded-lg border border-white/10 bg-black/55 px-2 py-1 text-center backdrop-blur-sm">
          <p className="text-[11px] font-semibold leading-none text-white">{player.name}</p>
          <p className="mt-1 text-[11px] font-bold leading-none text-sky-300">${player.stack.toLocaleString()}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.13em] text-white/60">{stateLabel(player)}</p>
        </div>

        {player.isHero ? (
          <>
            <div className="mt-1.5 h-1 w-[108px] overflow-hidden rounded-full border border-white/25 bg-black/70">
              <div
                className={`h-full ${heroTimerProgress <= 0.3 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.max(0, Math.min(1, heroTimerProgress)) * 100}%` }}
              />
            </div>
            <p className="mt-1 max-w-[140px] text-center text-[10px] font-semibold text-amber-200/95">{heroHandName}</p>
          </>
        ) : null}

        {(player.isSmallBlind || player.isBigBlind) && !player.isDealer ? (
          <div className="mt-1 inline-flex gap-1">
            {player.isSmallBlind ? (
              <span className="rounded-full bg-sky-300 px-1.5 py-0.5 text-[9px] font-black text-slate-900">SB</span>
            ) : null}
            {player.isBigBlind ? (
              <span className="rounded-full bg-orange-300 px-1.5 py-0.5 text-[9px] font-black text-slate-900">BB</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className={`absolute flex -translate-x-1/2 -translate-y-1/2 gap-1.5 ${player.folded ? 'opacity-45' : ''}`}
        style={{
          left: `${layout.cards.x - layout.seat.x}%`,
          top: `${layout.cards.y - layout.seat.y}%`
        }}
      >
        <Card
          key={`${animationKey}-${player.id}-0-${player.holeCards?.[0] || 'x'}`}
          card={player.holeCards?.[0] || null}
          hidden={player.cardsHidden}
          placeholder={!player.cardsHidden && !player.holeCards?.[0]}
          delay={0}
        />
        <Card
          key={`${animationKey}-${player.id}-1-${player.holeCards?.[1] || 'x'}`}
          card={player.holeCards?.[1] || null}
          hidden={player.cardsHidden}
          placeholder={!player.cardsHidden && !player.holeCards?.[1]}
          delay={70}
        />
      </div>

      {player.bet > 0 ? (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[160%]">
          <ChipBet amount={player.bet} />
        </div>
      ) : null}
    </div>
  );
}

function stateLabel(player) {
  if (player.busted) {
    return 'BUSTED';
  }
  if (player.folded) {
    return 'FOLDED';
  }
  if (player.allIn) {
    return 'ALL-IN';
  }
  if (player.isTurn) {
    return 'ACTING';
  }
  return 'ACTIVE';
}
