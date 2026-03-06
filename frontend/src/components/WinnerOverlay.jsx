export default function WinnerOverlay({ show, label, position }) {
  if (!show || !position) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${position.x}%`, top: `${position.y + 6}%` }}
    >
      <div className="rounded-2xl border border-amber-300/70 bg-black/60 px-5 py-2 text-center shadow-[0_0_42px_rgba(251,191,36,0.45)] backdrop-blur-md animate-fade-slide-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100/85">Winner</p>
        <p className="mt-0.5 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-5xl font-black tracking-[0.15em] text-transparent drop-shadow-[0_3px_10px_rgba(251,191,36,0.6)]">
          {label}
        </p>
      </div>
    </div>
  );
}
