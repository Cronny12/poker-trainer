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

export default function Card({ card, hidden = false, placeholder = false, delay = 0 }) {
  if (placeholder) {
    return <div className="h-[76px] w-[54px] rounded-lg border border-white/20 bg-white/5 sm:h-[90px] sm:w-[64px]" />;
  }

  if (hidden) {
    return (
      <div
        className="h-[76px] w-[54px] rounded-lg border border-blue-200/70 bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_8px_16px_rgba(0,0,0,0.35)] sm:h-[90px] sm:w-[64px]"
        style={{ animation: `fade-slide-up 220ms ease-out ${delay}ms both` }}
      >
        <div className="m-1 h-[calc(100%-0.5rem)] rounded-md border border-blue-100/50" />
      </div>
    );
  }

  if (!card) {
    return <div className="h-[76px] w-[54px] rounded-lg border border-white/10 bg-transparent sm:h-[90px] sm:w-[64px]" />;
  }

  const rank = card[0] === 'T' ? '10' : card[0];
  const suit = suitSymbol(card[1]);
  const isRed = card[1] === 'h' || card[1] === 'd';

  return (
    <div
      className="relative h-[76px] w-[54px] rounded-lg border-2 border-slate-300 bg-white shadow-[0_8px_16px_rgba(0,0,0,0.35)] sm:h-[90px] sm:w-[64px]"
      style={{ animation: `fade-slide-up 220ms ease-out ${delay}ms both` }}
    >
      <span className={`absolute left-1.5 top-1 text-[11px] font-black leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        {rank}
        <br />
        {suit}
      </span>
      <span className={`absolute inset-0 flex items-center justify-center text-2xl ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        {suit}
      </span>
    </div>
  );
}
