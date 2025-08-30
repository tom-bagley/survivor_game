import { useEffect, useMemo, useState, useCallback } from "react";

export default function EliminationSequence({
  week,
  eliminatedSurvivors = {},
  survivorPlayerStats = {},
  sharesOwned = {},
  prices = {},
  medianPrice = 0,
  prevNetWorth = 0,
  netWorth = 0,
  onFinish, 
}) {
  
  const survivorList = useMemo(
    () =>
      Object.keys(eliminatedSurvivors)
        .map((id) => eliminatedSurvivors[id])
        .filter(Boolean),
    [eliminatedSurvivors]
  );

  const totalStages = Math.max(1, survivorList.length + 1); 
  const [stageIndex, setStageIndex] = useState(0);

  // Navigation
  const nextStage = useCallback(() => {
    setStageIndex((i) => Math.min(i + 1, totalStages - 1));
  }, [totalStages]);

  const close = useCallback(() => {
    if (onFinish) onFinish();
  }, [onFinish]);

  
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        nextStage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, nextStage]);

  const formatUSD = (n) =>
    `$${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const renderSurvivorStage = (name) => {
    const survivor = survivorPlayerStats[name] || {};
    const shares = sharesOwned[name] || 0;
    const price = week === 0 ? Number(medianPrice) : Number(prices[name] || 0);
    const holdingsValue = shares * price;

    return (
      <div className="animate-fadein text-center w-full max-w-xl">
        <h1 className="font-heading text-2xl sm:text-3xl tracking-tight">
          Eliminated: {survivor.name || name}
        </h1>

        <div className="mt-4 mx-auto w-full max-w-[260px] sm:max-w-sm">
          <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/30 h-64 sm:h-80">
            {survivor.profile_pic ? (
              <img
                src={survivor.profile_pic}
                alt={survivor.name || name}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-white/50">
                No image
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-lg sm:text-xl">
          Money Lost:{" "}
          <span className="font-semibold text-red-flame">
            {formatUSD(holdingsValue)}
          </span>
        </div>
      </div>
    );
  };

  const renderNetWorthStage = () => (
    <div className="animate-fadein text-center w-full max-w-xl">
      <h1 className="font-heading text-2xl sm:text-3xl tracking-tight">
        Portfolio Update
      </h1>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
        <div className="rounded-xl bg-black/30 ring-1 ring-white/10 px-4 py-3">
          <div className="text-white/70 text-sm">Previous Net Worth</div>
          <div className="text-xl font-semibold">{formatUSD(prevNetWorth)}</div>
        </div>
        <div className="rounded-xl bg-black/30 ring-1 ring-white/10 px-4 py-3">
          <div className="text-white/70 text-sm">Current Net Worth</div>
          <div className="text-xl font-semibold">{formatUSD(netWorth)}</div>
        </div>
      </div>
      <p className="mt-3 text-white/60 text-sm">
        Press <kbd>Esc</kbd> to close.
      </p>
    </div>
  );

  const showingSurvivor = stageIndex < survivorList.length;
  const content = showingSurvivor
    ? renderSurvivorStage(survivorList[stageIndex])
    : renderNetWorthStage();

  // Nothing to show?
  if (!totalStages) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary blur-3xl opacity-30" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-accent blur-3xl opacity-25" />
      </div>

      <div className="relative z-10 h-[100dvh] w-full flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
          <div className="text-xs text-white/60">Week {week ?? "—"}</div>
          <button
            type="button"
            onClick={close}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary/70"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {/* main content (scrollable) */}
        <div className="flex-1 px-4 sm:px-8 py-4 overflow-y-auto">
          <div className="min-h-full grid place-items-center">{content}</div>
        </div>

        {/* progress + controls (fixed within modal) */}
        <div className="px-4 sm:px-8 pb-4 sm:pb-6 pt-2 [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)] bg-transparent">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalStages }).map((_, i) => (
              <span
                key={i}
                className={[
                  "h-2 w-2 rounded-full transition-all",
                  i === stageIndex ? "bg-primary scale-100" : "bg-white/20 scale-90",
                ].join(" ")}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            {showingSurvivor && (
              <button
                type="button"
                onClick={nextStage}
                className="rounded-lg bg-primary text-black font-semibold px-4 py-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70"
              >
                Next
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="rounded-lg bg-white/10 text-white px-4 py-2 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* tiny CSS for entrance */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein { animation: fadeInUp .6s ease-out both; }
      `}</style>
    </div>
  );
}





