import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageCard from '../components/PageCard';
import { chipsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const cards = [
  { title: 'Brain Teaser', to: '/app/brain-teaser', body: 'Solve today’s puzzle and push your streak for bigger rewards.' },
  { title: 'Free Daily Chips', to: '/app/daily-chips', body: 'Claim your daily free chip drop once every day.' },
  { title: 'Start Match', to: '/app/match', body: 'Configure 5 bots with custom styles and launch a 6-max table.' },
  { title: 'View Profile', to: '/app/profile', body: 'Review your stats, streaks, and chip total.' },
  { title: 'Edit Profile', to: '/app/profile/edit', body: 'Update your display name and bio.' }
];

export default function HomePage() {
  const { token, user, refreshMe } = useAuth();
  const [balance, setBalance] = useState(user?.chips || 0);
  const [streak, setStreak] = useState(user?.teaserStreak || 0);

  useEffect(() => {
    chipsApi
      .balance(token)
      .then((data) => {
        setBalance(data.chips);
        setStreak(data.teaserStreak);
      })
      .catch(() => null);
    refreshMe().catch(() => null);
  }, [token]);

  return (
    <div className="space-y-6">
      <PageCard
        title={`Welcome, ${user?.displayName || user?.username || 'Player'}`}
        subtitle="Your poker training hub for daily rewards, streak progress, and bot simulations."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-100/70">Chip Balance</p>
            <p className="mt-2 text-2xl font-bold">{balance}</p>
          </div>
          <div className="rounded-xl border border-velvet-red-400/30 bg-velvet-red-500/10 p-4">
            <p className="text-xs uppercase tracking-wider text-rose-100/70">Teaser Streak</p>
            <p className="mt-2 text-2xl font-bold">{streak} days</p>
          </div>
          <div className="rounded-xl border border-velvet-gold/50 bg-amber-300/10 p-4">
            <p className="text-xs uppercase tracking-wider text-amber-100/80">Record</p>
            <p className="mt-2 text-2xl font-bold">
              {user?.wins ?? 0}W / {user?.losses ?? 0}L
            </p>
          </div>
        </div>
      </PageCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            key={card.title}
            to={card.to}
            className="animate-fade-slide-up rounded-2xl border border-white/15 bg-black/25 p-5 transition hover:-translate-y-0.5 hover:border-velvet-green-400/40 hover:bg-black/35"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <h3 className="font-display text-xl font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/75">{card.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
