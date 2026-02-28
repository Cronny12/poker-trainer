import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { token, register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
      await register(username, email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-velvet-surface px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/35 p-7 backdrop-blur-lg animate-fade-slide-up">
        <h1 className="font-display text-3xl font-bold">Create account</h1>
        <p className="mt-2 text-sm text-white/70">Start your daily chip routine and bot training sessions.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-white/80">Username</span>
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none ring-emerald-300/60 focus:ring"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-white/80">Email</span>
            <input
              type="email"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none ring-emerald-300/60 focus:ring"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              minLength={6}
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-velvet-green-600 px-4 py-3 font-semibold transition hover:bg-velvet-green-500 disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-sm text-white/70">
          Already registered?{' '}
          <Link className="font-semibold text-velvet-gold hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
