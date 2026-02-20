export default function ScoreEfficiencyBar({ netWorth, maxPossibleBudget }) {
  const pct = Math.min(100, Math.max(0, (netWorth / maxPossibleBudget) * 100));
  const barColor = pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="mt-6 rounded-2xl bg-black/30 ring-1 ring-white/10 px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/60 uppercase tracking-widest">Score Efficiency</span>
        <span className="text-sm font-semibold">
          {pct.toFixed(1)}%
          <span className="text-white/40 font-normal text-xs ml-1">
            of max (${maxPossibleBudget.toFixed(0)})
          </span>
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
