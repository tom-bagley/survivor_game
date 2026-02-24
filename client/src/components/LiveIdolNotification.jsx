import { useEffect, useCallback } from "react";

const formatUSD = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function LiveIdolNotification({
  survivorName,
  bonusPerShare = 5.00,
  sharesOwned = 0,
  survivorProfilePic = null,
  onClose,
}) {
  const bonus = sharesOwned * bonusPerShare;

  const close = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

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
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-yellow-400/30 blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl opacity-40" />
      </div>

      <div className="relative z-10 h-[100dvh] w-full flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
          <div className="text-xs text-white/60 font-mono tracking-widest uppercase">Live · Episode</div>
          <button
            type="button"
            onClick={close}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
          >
            Close
          </button>
        </div>

        {/* main content */}
        <div className="flex-1 px-4 sm:px-8 py-4 overflow-y-auto">
          <div className="min-h-full grid place-items-center">
            <div className="animate-fadein text-center w-full max-w-xl">

              {/* idol icon row */}
              <div className="text-5xl mb-3">🏝</div>

              <h1 className="font-heading text-2xl sm:text-3xl tracking-tight text-yellow-300">
                Idol Found!
              </h1>
              <p className="mt-1 text-white/50 text-sm">
                {survivorName} found a hidden immunity idol
              </p>

              {/* survivor photo */}
              <div className="mt-5 mx-auto w-full max-w-[220px] sm:max-w-xs">
                <div className="relative rounded-2xl overflow-hidden ring-2 ring-yellow-400/40 bg-black/30 h-56 sm:h-72">
                  {survivorProfilePic ? (
                    <img
                      src={survivorProfilePic}
                      alt={survivorName}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-white/30 text-sm">
                      No image
                    </div>
                  )}
                  {/* golden glow overlay */}
                  <div className="absolute inset-0 ring-4 ring-inset ring-yellow-400/20 rounded-2xl pointer-events-none" />
                </div>
              </div>

              {/* bonus breakdown */}
              <div className="mt-5 rounded-xl bg-black/40 ring-1 ring-yellow-400/20 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 text-left">
                  <span className="text-xs text-white/50 uppercase tracking-widest">Your Bonus</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-white/70">
                    {sharesOwned} share{sharesOwned !== 1 ? "s" : ""} × {formatUSD(bonusPerShare)}/share
                  </span>
                  <span className="text-green-400 font-bold text-xl">+{formatUSD(bonus)}</span>
                </div>
              </div>

              {sharesOwned === 0 && (
                <p className="mt-3 text-white/40 text-sm">
                  You don't own shares in {survivorName} — no bonus this time.
                </p>
              )}

              {sharesOwned > 0 && (
                <p className="mt-3 text-white/60 text-sm">
                  {formatUSD(bonus)} has been added to your budget. Invest wisely!
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
              className="rounded-lg bg-yellow-400 text-black font-bold px-8 py-3 text-base hover:bg-yellow-300 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            >
              {sharesOwned > 0 ? "Nice! Invest Now" : "Got It"}
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
