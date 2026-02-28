import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(identifier, password);
      const destination = location.state?.from || '/app';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-velvet-surface px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/35 p-7 backdrop-blur-lg animate-fade-slide-up">
        <h1 className="font-display text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-white/70">Sign in to continue your poker streak and training.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-white/80">Username or email</span>
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none ring-emerald-300/60 focus:ring"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-white/80">Password</span>
            <input
              type="password"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none ring-emerald-300/60 focus:ring"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-velvet-red-600 px-4 py-3 font-semibold transition hover:bg-velvet-red-500 disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-white/70">
          New here?{' '}
          <Link className="font-semibold text-velvet-gold hover:underline" to="/register">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
