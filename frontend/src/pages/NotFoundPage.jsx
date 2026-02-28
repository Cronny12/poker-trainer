import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-velvet-surface px-4 text-white">
      <div className="rounded-2xl border border-white/15 bg-black/30 p-8 text-center backdrop-blur-lg">
        <h1 className="font-display text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-white/70">This route does not exist.</p>
        <Link to="/" className="mt-5 inline-block rounded-xl bg-velvet-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-velvet-red-500">
          Back to landing
        </Link>
      </div>
    </div>
  );
}
