import {
  BLIND_OPTIONS,
  DIFFICULTY_OPTIONS,
  MAX_BOTS,
  STACK_OPTIONS,
  STYLE_OPTIONS
} from '../game/engine';

export default function SetupScreen({ draft, setDraft, onStart, onQuickStart }) {
  const botCountOptions = Array.from({ length: MAX_BOTS }, (_, index) => index + 1);

  const handleBotCount = (value) => {
    const nextCount = Number(value);
    const nextBots = [];

    for (let i = 0; i < nextCount; i += 1) {
      const seat = i + 2;
      const existing = draft.bots.find((bot) => bot.seat === seat);
      nextBots.push(
        existing || {
          seat,
          name: `Bot ${i + 1}`,
          style: 'Balanced',
          difficulty: 'Medium'
        }
      );
    }

    setDraft((prev) => ({
      ...prev,
      numBots: nextCount,
      bots: nextBots
    }));
  };

  const updateBot = (seat, key, value) => {
    setDraft((prev) => ({
      ...prev,
      bots: prev.bots.map((bot) => (bot.seat === seat ? { ...bot, [key]: value } : bot))
    }));
  };

  const blindValue = `${draft.smallBlind}-${draft.bigBlind}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-white/15 bg-black/35 p-6 shadow-2xl backdrop-blur">
        <h1 className="font-display text-3xl font-bold text-white">Texas Hold'em Simulator</h1>
        <p className="mt-2 text-sm text-white/70">
          Configure a single-player table (you + up to 5 bots), then play full hands with real rules.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Bots (max 5)">
            <select
              value={draft.numBots}
              onChange={(event) => handleBotCount(event.target.value)}
              className="control"
            >
              {botCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Starting Stack">
            <select
              value={draft.startingStack}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  startingStack: Number(event.target.value)
                }))
              }
              className="control"
            >
              {STACK_OPTIONS.map((stack) => (
                <option key={stack} value={stack}>
                  {stack}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Blinds">
            <select
              value={blindValue}
              onChange={(event) => {
                const [small, big] = event.target.value.split('-').map(Number);
                setDraft((prev) => ({ ...prev, smallBlind: small, bigBlind: big }));
              }}
              className="control"
            >
              {BLIND_OPTIONS.map((blind) => (
                <option key={blind.label} value={`${blind.small}-${blind.big}`}>
                  {blind.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Seed (deterministic)">
            <input
              value={draft.seed}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  seed: event.target.value
                }))
              }
              className="control"
              inputMode="numeric"
            />
          </Field>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-semibold text-white">Bot Seats</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {draft.bots.map((bot) => (
              <div key={bot.seat} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <p className="text-sm font-semibold text-white">Seat {bot.seat}</p>
                <label className="mt-2 block text-xs text-white/65">Name</label>
                <input
                  value={bot.name}
                  onChange={(event) => updateBot(bot.seat, 'name', event.target.value)}
                  className="control mt-1"
                />

                <label className="mt-2 block text-xs text-white/65">Style</label>
                <select
                  value={bot.style}
                  onChange={(event) => updateBot(bot.seat, 'style', event.target.value)}
                  className="control mt-1"
                >
                  {STYLE_OPTIONS.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>

                <label className="mt-2 block text-xs text-white/65">Difficulty</label>
                <select
                  value={bot.difficulty}
                  onChange={(event) => updateBot(bot.seat, 'difficulty', event.target.value)}
                  className="control mt-1"
                >
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onStart} className="btn-primary">
            Start Match
          </button>
          <button type="button" onClick={onQuickStart} className="btn-secondary">
            Quick Start (You + 2 Bots)
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-white/60">{label}</span>
      {children}
    </label>
  );
}
