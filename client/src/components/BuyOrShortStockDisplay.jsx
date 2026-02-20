import React from "react";

const LONG_BONUSES = [
  { label: "Challenge Win",   rate: "+$5" },
  { label: "Right Side Vote", rate: "+$3" },
  { label: "Found Idol",      rate: "+$4" },
  { label: "Played Idol",     rate: "+$8" },
];

const SHORT_BONUSES = [
  { label: "Voted Out",       rate: "+$10", positive: true  },
  { label: "Challenge Win",   rate: "−$5",  positive: false },
  { label: "Right Side Vote", rate: "−$3",  positive: false },
  { label: "Found Idol",      rate: "−$4",  positive: false },
  { label: "Played Idol",     rate: "−$8",  positive: false },
];

export default function Display({
  name,
  profilePhotoUrl,
  shares,
  availableShares,
  shorts = 0,
  availableShorts = 0,
  buyStock,
  sellStock,
  shortStock,
  coverShort,
}) {
  const soldOut = availableShares === 0;
  const shortsPoolFull = availableShorts === 0;

  return (
    <div className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl overflow-hidden">

      {/* ── Header: photo + name + quick position summary ── */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-1 ring-white/20 flex-shrink-0 bg-black/30">
          <img src={profilePhotoUrl} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-lg tracking-tight text-white leading-tight truncate">{name}</h4>
          <div className="flex gap-3 mt-0.5 text-xs text-white/50">
            <span>
              <span className="text-primary font-semibold">{shares}</span> long
            </span>
            <span className="text-white/20">·</span>
            <span>
              <span className="text-red-400 font-semibold">{shorts}</span> short
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-column body: Long | Short ── */}
      <div className="grid grid-cols-2 divide-x divide-white/10">

        {/* Long column */}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-widest">Long</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-2.5 py-2 text-center">
              <div className="text-[10px] text-white/50 uppercase tracking-wide">Owned</div>
              <div className="mt-0.5 font-semibold text-sm text-white">{shares}</div>
            </div>
            <div className={`rounded-lg ring-1 px-2.5 py-2 text-center ${soldOut ? "bg-red-900/20 ring-red-500/30" : "bg-black/30 ring-white/10"}`}>
              <div className="text-[10px] text-white/50 uppercase tracking-wide">Pool</div>
              <div className={`mt-0.5 font-semibold text-sm ${soldOut ? "text-red-400" : "text-white"}`}>{availableShares}</div>
            </div>
          </div>

          {/* Bonus rules */}
          <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2.5 flex-1">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">Per share</p>
            <div className="space-y-1.5">
              {LONG_BONUSES.map(({ label, rate }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-white/60">{label}</span>
                  <span className="font-bold text-accent ml-2">{rate}</span>
                </div>
              ))}
            </div>
            {shares > 0 && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="text-white/40">Best episode</span>
                <span className="font-bold text-accent">+${shares * 8}</span>
              </div>
            )}
          </div>

          {/* Trade buttons */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => buyStock(name, 1)}
              disabled={soldOut}
              className={`flex-1 rounded-lg font-semibold text-sm py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70
                ${soldOut ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-primary text-black hover:bg-accent"}`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => sellStock(name, 1)}
              disabled={shares === 0}
              className={`flex-1 rounded-lg font-semibold text-sm py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70
                ${shares === 0 ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Short column */}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-red-400/80 uppercase tracking-widest">Short</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-2.5 py-2 text-center">
              <div className="text-[10px] text-white/50 uppercase tracking-wide">Owned</div>
              <div className="mt-0.5 font-semibold text-sm text-white">{shorts}</div>
            </div>
            <div className={`rounded-lg ring-1 px-2.5 py-2 text-center ${shortsPoolFull ? "bg-red-900/20 ring-red-500/30" : "bg-black/30 ring-white/10"}`}>
              <div className="text-[10px] text-white/50 uppercase tracking-wide">Pool</div>
              <div className={`mt-0.5 font-semibold text-sm ${shortsPoolFull ? "text-red-400" : "text-white"}`}>{availableShorts}</div>
            </div>
          </div>

          {/* Short rules */}
          <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2.5 flex-1">
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">Per short</p>
            <div className="space-y-1.5">
              {SHORT_BONUSES.map(({ label, rate, positive }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-white/60">{label}</span>
                  <span className={`font-bold ml-2 ${positive ? "text-accent" : "text-red-400"}`}>{rate}</span>
                </div>
              ))}
            </div>
            {shorts > 0 && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="text-white/40">If voted out</span>
                <span className="font-bold text-accent">+${shorts * 10}</span>
              </div>
            )}
          </div>

          {/* Trade buttons */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => shortStock(name, 1)}
              disabled={shortsPoolFull}
              className={`flex-1 rounded-lg font-semibold text-sm py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50
                ${shortsPoolFull ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-red-600/80 text-white hover:bg-red-500"}`}
            >
              Short
            </button>
            <button
              type="button"
              onClick={() => coverShort(name, 1)}
              disabled={shorts === 0}
              className={`flex-1 rounded-lg font-semibold text-sm py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70
                ${shorts === 0 ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              Cover
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
