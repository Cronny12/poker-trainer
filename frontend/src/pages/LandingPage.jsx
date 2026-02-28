import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Daily Free Chips',
    description: 'Claim a free chip drop once per day and keep your stack growing.'
  },
  {
    title: 'Brain Teaser Streaks',
    description: 'Solve one teaser per day. Build streaks for larger reward multipliers.'
  },
  {
    title: 'Bot Match Trainer',
    description: 'Play 9-max tables with up to 8 bots and choose each bot strategy.'
  },
  {
    title: '10 Play Styles',
    description: 'Mix nit, LAG, GTO-lite and more. Manual seat setup or randomized lineups.'
  },
  {
    title: 'No Chip Loss in Practice',
    description: 'Match outcomes track your record only. Your core stack is safe in training.'
  },
  {
    title: 'Progress Profile',
    description: 'Track wins/losses, streaks, and chip growth from one clean dashboard.'
  }
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-velvet-surface text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(47,160,112,0.25),transparent_45%),radial-gradient(circle_at_90%_20%,rgba(201,54,90,0.22),transparent_42%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex items-center justify-between">
          <span className="font-display text-xl font-bold tracking-wide text-velvet-gold">Velvet Poker Trainer</span>
          <div className="flex gap-3">
            <Link to="/login" className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-velvet-red-600 px-5 py-2.5 text-sm font-semibold shadow-[0_0_30px_rgba(161,36,71,0.35)] hover:bg-velvet-red-500"
            >
              Register
            </Link>
          </div>
        </header>

        <section className="mt-14 max-w-3xl animate-fade-slide-up">
          <p className="inline-block rounded-full border border-velvet-green-500/40 bg-velvet-green-700/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Poker Training Platform
          </p>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
            Build poker instincts with <span className="text-velvet-gold">strategy bots</span> and daily rewards.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            Log in, claim free chips, solve brain teasers for streak rewards, and run bot tables with your own lineup of play styles.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-full bg-velvet-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-velvet-green-500"
            >
              Start Training
            </Link>
            <Link to="/login" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold hover:bg-white/10">
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="animate-fade-slide-up rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur-lg"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <h3 className="font-display text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
