import { useEffect, useCallback } from "react";

const formatAmt = (n) =>
  `${n >= 0 ? "+" : "-"}$${Math.abs(Number(n || 0)).toFixed(2)}`;

const EVENT_CONFIG = {
  wonChallenge:        { emoji: "🏆", title: "Challenge Win!",           description: "won a challenge",                        longRate: 0.10  },
  lostChallenge:       { emoji: "📉", title: "Challenge Loss",            description: "lost a challenge",                       longRate: -0.10 },
  rightSideOfVote:     { emoji: "🗳️",  title: "Right Side of the Vote!", description: "voted with the majority",                 longRate: 0.08  },
  wrongSideOfVote:     { emoji: "❌", title: "Wrong Side of the Vote",   description: "voted with the minority",                longRate: -0.08 },
  playedIdolCorrectly: { emoji: "🔮", title: "Idol Played Correctly!",   description: "played a hidden immunity idol correctly", longRate: 2.00  },
};

export default function LiveEventNotification({
  field,
  survivorName,
  survivorProfilePic = null,
  sharesOwned = 0,
  onClose,
}) {
  const config = EVENT_CONFIG[field] || {
    emoji: "⚡", title: "Live Event!", description: "triggered an event", longRate: 0,
  };

  const sharesImpact = sharesOwned * config.longRate;
  const totalImpact  = sharesImpact;
  const hasPosition  = sharesOwned > 0;
  const isGain       = totalImpact >= 0;

  const accentColor = isGain ? "#5ecf7a" : "#ff8888";
  const glowHue     = isGain ? "rgba(94,207,122,0.3)" : "rgba(255,68,68,0.2)";
  const ringColor   = isGain ? "rgba(94,207,122,0.4)" : "rgba(255,68,68,0.3)";

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

              <div className="text-5xl mb-3">{config.emoji}</div>
              <h1 className="font-heading text-2xl sm:text-3xl tracking-tight" style={{ color: accentColor }}>
                {config.title}
              </h1>
              <p className="mt-1 text-white/50 text-sm">
                {survivorName} {config.description}
              </p>

              {/* survivor photo */}
              <div className="mt-5 mx-auto w-full max-w-[220px] sm:max-w-xs">
                <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72" style={{ background: "rgba(0,0,0,0.3)" }}>
                  {survivorProfilePic ? (
                    <img src={survivorProfilePic} alt={survivorName} className="h-full w-full object-cover object-top" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-white/30 text-sm">No image</div>
                  )}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `inset 0 0 0 2px ${ringColor}` }} />
                </div>
              </div>

              {/* impact breakdown */}
              <div className="mt-5 rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${ringColor}` }}>
                <div className="px-4 py-3 border-b border-white/10 text-left">
                  <span className="text-xs text-white/50 uppercase tracking-widest">Your Impact</span>
                </div>

                {sharesOwned > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                    <span className="text-sm text-white/70">
                      {sharesOwned} share{sharesOwned !== 1 ? "s" : ""} × {config.longRate >= 0 ? "+" : ""}${Math.abs(config.longRate).toFixed(2)}/share
                    </span>
                    <span className="font-bold text-base" style={{ color: sharesImpact >= 0 ? "#5ecf7a" : "#ff8888" }}>
                      {formatAmt(sharesImpact)}
                    </span>
                  </div>
                )}

                {hasPosition ? (
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white/80">Total</span>
                    <span className="font-bold text-xl" style={{ color: accentColor }}>
                      {formatAmt(totalImpact)}
                    </span>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-white/40 text-sm">
                    You have no position in {survivorName} — no impact this time.
                  </div>
                )}
              </div>

              {hasPosition && totalImpact > 0 && (
                <p className="mt-3 text-white/60 text-sm">
                  {formatAmt(totalImpact)} added to your bonus balance. Invest wisely!
                </p>
              )}
              {hasPosition && totalImpact < 0 && (
                <p className="mt-3 text-white/50 text-sm">
                  {formatAmt(totalImpact)} deducted from your budget.
                </p>
              )}

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
              style={{ background: accentColor, color: isGain ? "black" : "white" }}
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
