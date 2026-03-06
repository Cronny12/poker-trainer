import { useMemo } from 'react';
import CommunityCards from './CommunityCards';
import Seat from './Seat';
import WinnerOverlay from './WinnerOverlay';

const SEAT_LAYOUT = {
  1: { seat: { x: 50, y: 88 }, cards: { x: 50, y: 66 }, align: 'center' },
  2: { seat: { x: 16, y: 69 }, cards: { x: 24, y: 62 }, align: 'left' },
  3: { seat: { x: 16, y: 28 }, cards: { x: 25, y: 34 }, align: 'left' },
  4: { seat: { x: 50, y: 10 }, cards: { x: 50, y: 20 }, align: 'center' },
  5: { seat: { x: 84, y: 28 }, cards: { x: 75, y: 34 }, align: 'right' },
  6: { seat: { x: 84, y: 69 }, cards: { x: 76, y: 62 }, align: 'right' }
};

export default function PokerTableCanvas({
  table,
  animationKey,
  actionArea,
  onToggleFullscreen,
  isFullscreen
}) {
  const players = useMemo(() => [...table.players].sort((a, b) => a.seat - b.seat), [table.players]);
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#04070c] p-2 sm:p-4">
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="absolute right-3 top-3 z-40 rounded-full border border-white/30 bg-black/55 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur hover:bg-black/75"
      >
        {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
      </button>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.09),transparent_40%),radial-gradient(circle_at_20%_10%,rgba(29,122,87,0.2),transparent_38%),linear-gradient(180deg,#05070d_0%,#111827_100%)]" />

      <div className={`relative mx-auto w-full ${isFullscreen ? 'max-w-none' : 'max-w-[1180px]'}`}>
        <div className={`relative aspect-[16/9] ${isFullscreen ? 'h-[calc(100vh-2.2rem)] min-h-0' : 'min-h-[430px] sm:min-h-[560px]'}`}>
          <div className="absolute inset-[2.4%] rounded-[999px] bg-[#0b1117] shadow-[inset_0_10px_50px_rgba(255,255,255,0.07),inset_0_-20px_60px_rgba(0,0,0,0.8),0_20px_45px_rgba(0,0,0,0.65)]" />
          <div className="absolute inset-[5.4%] rounded-[999px] border border-emerald-400/12 bg-[radial-gradient(ellipse_at_center,rgba(27,124,81,0.95)_0%,rgba(14,90,58,0.96)_52%,rgba(8,56,37,0.98)_100%)] shadow-[inset_0_0_120px_rgba(0,0,0,0.42)]" />
          <div className="pointer-events-none absolute inset-[5.4%] rounded-[999px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />

          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="mb-2 inline-flex rounded-full border border-emerald-300/25 bg-black/45 px-4 py-1 text-sm font-bold text-amber-200 shadow-[0_6px_20px_rgba(0,0,0,0.45)]">
              Total Pot: {table.displayPot}
            </p>
            {table.streetBetTotal > 0 ? (
              <p className="mb-2 text-[11px] font-semibold text-white/70">In front bets: {table.streetBetTotal}</p>
            ) : null}
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">{table.stageLabel}</p>
            <CommunityCards cards={table.communityCards} animationKey={animationKey} />
          </div>

          {players.map((player) => (
            <Seat
              key={player.id}
              player={player}
              layout={SEAT_LAYOUT[player.seat] || SEAT_LAYOUT[1]}
              animationKey={animationKey}
            />
          ))}

          <WinnerOverlay
            show={table.showWinnerOverlay}
            label={table.winnerLabel}
          />

          {isFullscreen ? (
            <p className="pointer-events-none absolute bottom-[17%] right-[6%] z-40 text-right text-xs font-semibold text-white/85">
              Current Hand: <span className="text-amber-200">{table.heroHandName}</span>
            </p>
          ) : null}

          {actionArea ? (
            <div className="absolute bottom-[4%] left-1/2 z-40 w-[94%] max-w-[920px] -translate-x-1/2">
              {actionArea}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
