export default function WinnerOverlay({ show, label }) {
  if (!show) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="rounded-2xl border border-amber-300/70 bg-black/60 px-4 py-1.5 text-center shadow-[0_0_32px_rgba(251,191,36,0.35)] backdrop-blur-md animate-fade-slide-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100/85">Winner</p>
        <p className={`mt-0.5 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text font-black tracking-[0.12em] text-transparent drop-shadow-[0_3px_10px_rgba(251,191,36,0.6)] ${label.length > 12 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
          {label}
        </p>
      </div>
    </div>
  );
}
