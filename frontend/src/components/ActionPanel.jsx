import { useEffect, useMemo, useState } from 'react';

export default function ActionPanel({
  legal,
  onAction,
  disabled,
  tableState = { pot: 0, currentBet: 0 },
  timeRemaining = 15
}) {
  const [amount, setAmount] = useState(0);

  const canRaise = legal.available.includes('raise');
  const canBet = legal.available.includes('bet');

  const mode = canRaise ? 'raise' : canBet ? 'bet' : null;

  const sliderBounds = useMemo(() => {
    if (canRaise) {
      return { min: legal.minRaiseTo, max: legal.maxRaiseTo };
    }
    if (canBet) {
      return { min: legal.minBetTo, max: legal.maxBetTo };
    }
    return { min: 0, max: 0 };
  }, [canRaise, canBet, legal]);

  useEffect(() => {
    setAmount(sliderBounds.min || 0);
  }, [sliderBounds.min, sliderBounds.max]);

  const quickSizes = useMemo(() => {
    if (!mode || sliderBounds.max <= 0) {
      return [];
    }

    const clamp = (value) => Math.max(sliderBounds.min, Math.min(sliderBounds.max, value));
    const pot = Math.max(0, Number(tableState.pot) || 0);
    const currentBet = Math.max(0, Number(tableState.currentBet) || 0);

    const candidates = [
      { label: '1/2 Pot', value: mode === 'raise' ? currentBet + Math.round(pot * 0.5) : Math.round(pot * 0.5) },
      { label: 'Pot', value: mode === 'raise' ? currentBet + pot : pot },
      { label: '2x Pot', value: mode === 'raise' ? currentBet + (pot * 2) : pot * 2 },
      { label: 'Max', value: sliderBounds.max }
    ];

    const seen = new Set();
    return candidates
      .map((item) => ({
        label: item.label,
        value: clamp(Math.round(item.value || sliderBounds.min))
      }))
      .filter((item) => {
        const key = `${item.value}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }, [mode, sliderBounds.min, sliderBounds.max, tableState.currentBet, tableState.pot]);

  const showSizeControls = Boolean(mode) && sliderBounds.max >= sliderBounds.min && sliderBounds.max > 0;
  const timerProgress = Math.max(0, Math.min(1, timeRemaining / 15));
  const clampToBounds = (value) => {
    if (!Number.isFinite(value)) {
      return sliderBounds.min || 0;
    }
    return Math.max(sliderBounds.min, Math.min(sliderBounds.max, Math.round(value)));
  };

  return (
    <div className="space-y-2 rounded-xl border border-white/20 bg-black/70 p-2.5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/75 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
          <span>To Call: {legal.toCall}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${timeRemaining <= 5 ? 'bg-rose-500/55 text-rose-100' : 'bg-emerald-500/55 text-emerald-100'}`}>
            {timeRemaining}s
          </span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full border border-white/30 bg-black/65">
        <div
          className={`h-full transition-[width] duration-150 ${timeRemaining <= 5 ? 'bg-rose-400' : 'bg-emerald-400'}`}
          style={{ width: `${timerProgress * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          disabled={disabled || !legal.available.includes('fold')}
          onClick={() => onAction({ type: 'fold' })}
          className="rounded-full border border-rose-300/70 bg-rose-600/60 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/75 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Fold
        </button>

        {legal.available.includes('check') ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAction({ type: 'check' })}
            className="rounded-full border border-sky-300/70 bg-sky-600/55 px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/75 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || !legal.available.includes('call')}
            onClick={() => onAction({ type: 'call' })}
            className="rounded-full border border-sky-300/70 bg-sky-600/55 px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/75 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Call {legal.toCall}
          </button>
        )}

        {mode ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAction({ type: mode, amount })}
            className="rounded-full border border-emerald-300/70 bg-emerald-600/60 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/75 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {mode === 'raise' ? `Raise ${amount}` : `Bet ${amount}`}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/50"
          >
            Raise
          </button>
        )}

        <button
          type="button"
          disabled={disabled || !legal.available.includes('all-in')}
          onClick={() => onAction({ type: 'all-in' })}
          className="rounded-full border border-amber-300/70 bg-amber-500/60 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/75 disabled:cursor-not-allowed disabled:opacity-45"
        >
          All-in
        </button>
      </div>

      {showSizeControls ? (
        <div className="rounded-xl border border-white/20 bg-black/60 p-2.5 backdrop-blur">
          <div className="mb-2 flex flex-wrap gap-2">
            {quickSizes.map((size) => (
              <button
                key={`${size.label}-${size.value}`}
                type="button"
                disabled={disabled}
                onClick={() => setAmount(size.value)}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  amount === size.value
                    ? 'border-emerald-300/60 bg-emerald-400/25 text-emerald-50'
                    : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                {size.label}
              </button>
            ))}
          </div>

          <div className="mb-2 flex items-center gap-2">
            <input
              type="number"
              min={sliderBounds.min}
              max={sliderBounds.max}
              step="1"
              value={amount}
              onChange={(event) => setAmount(clampToBounds(Number(event.target.value)))}
              className="w-32 rounded-lg border border-white/30 bg-black/70 px-2.5 py-1.5 text-sm font-semibold text-white outline-none focus:border-emerald-300"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => setAmount(clampToBounds(amount))}
              disabled={disabled}
              className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Set Amount
            </button>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-[11px] text-white/70">
              <span>Min {sliderBounds.min}</span>
              <span>{mode === 'raise' ? `Current ${tableState.currentBet}` : 'Bet sizing'}</span>
              <span>Max {sliderBounds.max}</span>
            </div>
            <input
              type="range"
              min={sliderBounds.min}
              max={sliderBounds.max}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="h-2 w-full cursor-pointer accent-emerald-400"
              disabled={disabled}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
