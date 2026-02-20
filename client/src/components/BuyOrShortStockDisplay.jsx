import React from "react";

export default function Display({ name, profilePhotoUrl, shares, availableShares, maxSharesPerPlayer, buyStock, sellStock }) {
  const soldOut = availableShares === 0;

  return (
    <div className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl px-4 py-5 sm:px-5 flex flex-col items-center text-center">

      {/* Profile Image */}
      <div className="w-full mb-4">
        <div
          className="relative mx-auto rounded-xl overflow-hidden bg-black/20 aspect-[3/4] ring-2 ring-white/20"
          style={{ maxWidth: "150px" }}
        >
          <img
            src={profilePhotoUrl}
            alt="Profile"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      </div>

      {/* Name */}
      <h4 className="font-heading text-xl text-white tracking-tight">{name}</h4>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-3 w-full text-sm">
        <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2">
          <div className="text-white/60">Shares</div>
          <div className="font-semibold">{shares}</div>
        </div>
        <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2">
          <div className="text-white/60">Price</div>
          <div className="font-semibold">$2.00</div>
        </div>
        <div className={`rounded-lg px-3 py-2 ring-1 ${soldOut ? "bg-red-900/30 ring-red-500/40" : "bg-black/30 ring-white/10"}`}>
          <div className="text-white/60">Available</div>
          <div className={`font-semibold ${soldOut ? "text-red-400" : ""}`}>
            {availableShares}<span className="text-white/40 text-xs"> / {maxSharesPerPlayer}</span>
          </div>
        </div>
      </div>

      {/* Trade Controls */}
      <div className="mt-4 w-full rounded-xl bg-black/30 ring-1 ring-white/10 p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => buyStock(name, 1)}
            disabled={soldOut}
            className={`inline-flex items-center justify-center rounded-lg font-semibold px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70
              ${soldOut
                ? "bg-white/5 text-white/30 cursor-not-allowed"
                : "bg-primary text-black hover:bg-accent"
              }`}
          >
            Buy 1
          </button>
          <button
            type="button"
            onClick={() => sellStock(name, 1)}
            className="inline-flex items-center justify-center rounded-lg bg-white/10 text-white font-semibold px-4 py-2 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70"
          >
            Sell 1
          </button>
        </div>
      </div>

    </div>
  );
}
