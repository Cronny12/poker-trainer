import { useEffect, useMemo, useState } from 'react';

export default function ActionPanel({ legal, onAction, disabled }) {
  const [amount, setAmount] = useState(0);

  const sliderBounds = useMemo(() => {
    if (legal.available.includes('raise')) {
      return { min: legal.minRaiseTo, max: legal.maxRaiseTo };
    }
    if (legal.available.includes('bet')) {
      return { min: legal.minBetTo, max: legal.maxBetTo };
    }
    return { min: 0, max: 0 };
  }, [legal]);

  useEffect(() => {
    setAmount(sliderBounds.min || 0);
  }, [sliderBounds.min, sliderBounds.max]);

  const canRaise = legal.available.includes('raise');
  const canBet = legal.available.includes('bet');

  return (
    <div className="rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-white">Your Action</p>
      <p className="mt-1 text-xs text-white/65">To call: {legal.toCall}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {legal.available.includes('fold') ? (
          <button type="button" onClick={() => onAction({ type: 'fold' })} disabled={disabled} className="btn-tertiary">
            Fold
          </button>
        ) : null}

        {legal.available.includes('check') ? (
          <button type="button" onClick={() => onAction({ type: 'check' })} disabled={disabled} className="btn-secondary">
            Check
          </button>
        ) : null}

        {legal.available.includes('call') ? (
          <button type="button" onClick={() => onAction({ type: 'call' })} disabled={disabled} className="btn-secondary">
            Call
          </button>
        ) : null}

        {canBet ? (
          <button type="button" onClick={() => onAction({ type: 'bet', amount })} disabled={disabled} className="btn-primary">
            Bet {amount}
          </button>
        ) : null}

        {canRaise ? (
          <button type="button" onClick={() => onAction({ type: 'raise', amount })} disabled={disabled} className="btn-primary">
            Raise To {amount}
          </button>
        ) : null}

        {legal.available.includes('all-in') ? (
          <button type="button" onClick={() => onAction({ type: 'all-in' })} disabled={disabled} className="btn-warning">
            All-In
          </button>
        ) : null}
      </div>

      {(canBet || canRaise) && sliderBounds.max > sliderBounds.min ? (
        <div className="mt-4">
          <label className="text-xs text-white/60">Amount</label>
          <input
            type="range"
            min={sliderBounds.min}
            max={sliderBounds.max}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-2 w-full"
            disabled={disabled}
          />
          <div className="mt-1 flex justify-between text-xs text-white/50">
            <span>{sliderBounds.min}</span>
            <span>{sliderBounds.max}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
