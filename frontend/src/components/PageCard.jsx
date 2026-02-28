export default function PageCard({ title, subtitle, children, className = '' }) {
  return (
    <section
      className={`animate-fade-slide-up rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur-lg shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:p-7 ${className}`}
    >
      <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm text-white/70">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
