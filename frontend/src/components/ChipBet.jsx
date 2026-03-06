export default function ChipBet({ amount }) {
  return (
    <div className="inline-flex min-w-[56px] items-center justify-center rounded-full border-2 border-white/85 bg-gradient-to-b from-rose-300 to-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-[0_8px_18px_rgba(0,0,0,0.45)]">
      {amount}
    </div>
  );
}
