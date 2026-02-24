import { useEffect, useCallback } from "react";

const RIGHT_RATE = 1.00;
const WRONG_RATE = 0;

const fmt = (n) => `${n >= 0 ? "+" : "-"}$${Math.abs(Number(n || 0)).toFixed(2)}`;

export default function LiveVoteNotification({
  voteEvent,      // { rightSide: [], wrongSide: [] }
  sharesOwned,    // { survivorName: count }
  onClose,
}) {
  const { rightSide = [], wrongSide = [] } = voteEvent;

  let totalImpact = 0;
  for (const name of rightSide) {
    totalImpact += (sharesOwned[name] || 0) * RIGHT_RATE;
  }
  for (const name of wrongSide) {
    totalImpact -= (sharesOwned[name] || 0) * WRONG_RATE;
  }

  const isGain      = totalImpact >= 0;
  const accentColor = totalImpact === 0 ? "#7dd3fc" : isGain ? "#5ecf7a" : "#ff8888";
  const glowHue     = totalImpact === 0 ? "rgba(125,211,252,0.25)" : isGain ? "rgba(94,207,122,0.3)" : "rgba(255,68,68,0.2)";

  const close = useCallback(() => { if (onClose) onClose(); }, [onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const hasPosition = rightSide.some(n => sharesOwned[n]) ||
                      wrongSide.some(n => sharesOwned[n]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position: "absolute", top: -96, left: "50%", transform: "translateX(-50%)", height: 288, width: 288, borderRadius: "50%", background: glowHue, filter: "blur(48px)", opacity: 0.6 }} />
        <div style={{ position: "absolute", bottom: -96, right: -64, height: 320, width: 320, borderRadius: "50%", background: glowHue, filter: "blur(48px)", opacity: 0.3 }} />
      </div>

      <div className="relative z-10 h-[100dvh] w-full flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
          <div className="text-xs text-white/60 font-mono tracking-widest uppercase">Live · Episode</div>
          <button
            type="button"
            onClick={close}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 focus:outline-none"
          >
            Close
          </button>
        </div>

        {/* main content */}
        <div className="flex-1 px-4 sm:px-8 py-4 overflow-y-auto">
          <div className="min-h-full grid place-items-center">
            <div className="animate-fadein text-center w-full max-w-xl">

              <div className="text-5xl mb-3">🗳️</div>
              <h1 className="font-heading text-2xl sm:text-3xl tracking-tight" style={{ color: accentColor }}>
                Tribal Council Vote
              </h1>

              {/* Right side / Wrong side panels */}
              <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                {rightSide.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(94,207,122,0.08)", border: "1px solid rgba(94,207,122,0.25)" }}>
                    <div className="text-xs text-white/50 uppercase tracking-widest mb-2">Right Side</div>
                    {rightSide.map(name => {
                      const shares = sharesOwned[name] || 0;
                      const impact = shares * RIGHT_RATE;
                      return (
                        <div key={name} className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/80">{name}</span>
                          {shares > 0 && (
                            <span className="text-xs font-bold" style={{ color: "#5ecf7a" }}>{fmt(impact)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {wrongSide.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.25)" }}>
                    <div className="text-xs text-white/50 uppercase tracking-widest mb-2">Wrong Side</div>
                    {wrongSide.map(name => {
                      const shares = sharesOwned[name] || 0;
                      const impact = -(shares * WRONG_RATE);
                      return (
                        <div key={name} className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/80">{name}</span>
                          {shares > 0 && (
                            <span className="text-xs font-bold" style={{ color: "#fb923c" }}>{fmt(impact)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total impact */}
              <div className="mt-4 rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {hasPosition ? (
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white/80">Your Total Impact</span>
                    <span className="font-bold text-xl" style={{ color: accentColor }}>{fmt(totalImpact)}</span>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-white/40 text-sm text-left">
                    You have no positions in any of these players — no impact this time.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* bottom controls */}
        <div className="px-4 sm:px-8 pb-6 pt-2">
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={close}
              className="rounded-lg font-bold px-8 py-3 text-base transition-colors focus:outline-none"
              style={{ background: accentColor, color: totalImpact === 0 ? "black" : isGain ? "black" : "white" }}
            >
              {hasPosition && totalImpact > 0 ? "Nice! Invest Now" : "Got It"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein { animation: fadeInUp .6s ease-out both; }
      `}</style>
    </div>
  );
}
