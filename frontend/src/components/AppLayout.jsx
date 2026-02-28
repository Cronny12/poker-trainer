import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/app', label: 'Home' },
  { to: '/app/brain-teaser', label: 'Brain Teaser' },
  { to: '/app/daily-chips', label: 'Daily Chips' },
  { to: '/app/match', label: 'Start Match' },
  { to: '/app/profile', label: 'Profile' }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-velvet-surface text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/35 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/app" className="font-display text-lg font-bold tracking-wide text-velvet-gold">
            Velvet Poker Trainer
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? 'bg-velvet-red-600 text-white shadow-[0_0_20px_rgba(161,36,71,0.45)]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.displayName || user?.username}</p>
              <p className="text-xs text-emerald-200/80">{user?.chips ?? 0} chips</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-velvet-red-500/70 bg-velvet-red-700/60 px-4 py-2 text-sm font-semibold hover:bg-velvet-red-600"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
