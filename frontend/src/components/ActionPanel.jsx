import { useEffect, useMemo, useState } from 'react';

export default function ActionPanel({ legal, onAction, disabled, tableState = { pot: 0, currentBet: 0 } }) {
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

  return (
    <div className="rounded-2xl border border-white/20 bg-[#0d1220]/92 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold tracking-wide text-white">Your Action</p>
        <p className="text-xs uppercase tracking-[0.16em] text-white/60">To Call: {legal.toCall}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          disabled={disabled || !legal.available.includes('fold')}
          onClick={() => onAction({ type: 'fold' })}
          className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Fold
        </button>

        {legal.available.includes('check') ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAction({ type: 'check' })}
            className="rounded-xl border border-sky-300/35 bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || !legal.available.includes('call')}
            onClick={() => onAction({ type: 'call' })}
            className="rounded-xl border border-sky-300/35 bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Call {legal.toCall}
          </button>
        )}

        {mode ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAction({ type: mode, amount })}
            className="rounded-xl border border-emerald-300/35 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {mode === 'raise' ? `Raise ${amount}` : `Bet ${amount}`}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/50"
          >
            Raise
          </button>
        )}

        <button
          type="button"
          disabled={disabled || !legal.available.includes('all-in')}
          onClick={() => onAction({ type: 'all-in' })}
          className="rounded-xl border border-amber-300/40 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-45"
        >
          All-in
        </button>
      </div>

      {showSizeControls ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickSizes.map((size) => (
              <button
                key={`${size.label}-${size.value}`}
                type="button"
                disabled={disabled}
                onClick={() => setAmount(size.value)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  amount === size.value
                    ? 'border-emerald-300/60 bg-emerald-400/25 text-emerald-50'
                    : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                {size.label}
              </button>
            ))}
          </div>

          <div>
            <div className="mb-1 flex justify-between text-[11px] text-white/60">
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
