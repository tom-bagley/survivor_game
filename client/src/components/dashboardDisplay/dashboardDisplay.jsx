import React from "react";
import StockChart from "../stockChartDashboard/stockChartDashboard";

export default function Display({
  name,
  profilePhotoUrl,
  shares,
  price,
  holdingsValue,
  buyStock,
  sellStock,
  eliminated,
  season,
  week,
  historical_prices = [],
  medianPrice = 0,
}) {
  const latestPrice =
    historical_prices.length > 0
      ? Number(historical_prices[historical_prices.length - 1]?.price ?? 0)
      : null;
  const isGood = latestPrice != null && latestPrice > Number(medianPrice || 0);

  const safePrice = typeof price === "number" ? price : 0;
  const safeHoldings = typeof holdingsValue === "number" ? holdingsValue : 0;
  const maxPrice = medianPrice * 2;
  const highThreshold = maxPrice * 0.9; // 1.8 * median
  const lowThreshold  = maxPrice * 0.1; // 0.2 * median
  const isRegularSeason = Number(week) > 0;

  return (
    <div
  className={[
    "rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl",
    "px-4 py-5 sm:px-5",
    "flex flex-col items-center text-center",
    eliminated ? "grayscale" : "",
  ].join(" ")}
>
      {/* Profile Image (smaller, shows full headshot) */}
<div className="w-full mb-4">
  <div
    className={[
      "relative mx-auto rounded-xl overflow-hidden bg-black/20",
      "aspect-[3/4]", // keeps portrait ratio
      "ring-2",
      week != 0
        ? eliminated
          ? "ring-red-flame/40"
          : isGood
          ? "ring-green-dark/50"
          : "ring-red-flame/50"
        : "ring-black/50" // fallback when week !== 0
    ].join(" ")}
    style={{ maxWidth: "150px" }} // fixed max width across devices
  >
    <img
      src={profilePhotoUrl}
      alt="Profile"
      className="w-full h-full object-cover rounded-lg"
    />
  </div>
</div>



      {/* Name & Details */}
      <h4 className="font-heading text-xl text-white tracking-tight flex items-center gap-2">
        <span>{name}</span>
        {isRegularSeason &&  latestPrice > highThreshold && (
            <span className="text-accent" aria-label="hot">🔥</span>
          )}
        {!Number.isNaN(latestPrice) && latestPrice < lowThreshold && isRegularSeason && (
            <span aria-label="cold">❄️</span>
          )}
      </h4>

      <div className="mt-3 grid grid-cols-3 gap-3 w-full text-sm">
        <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2">
          <div className="text-white/60">Shares</div>
          <div className="font-semibold">{shares}</div>
        </div>
        <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2">
          <div className="text-white/60">Price</div>
          <div className="font-semibold">${safePrice.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2">
          <div className="text-white/60">{eliminated ? "Total Lost" : "Value"}</div>
          <div className={["font-semibold", eliminated ? "text-red-flame" : "text-white"].join(" ")}>
            ${safeHoldings.toFixed(2)}
          </div>
        </div>
      </div>

{/* Trade Controls (only for active players) */}
{!eliminated && (
  <div className="mt-4 grid grid-cols-2 gap-3">
    {/* Quick (x1) */}
    <div className="rounded-xl bg-black/30 ring-1 ring-white/10 p-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => buyStock(name, 1)}
          className="inline-flex items-center justify-center rounded-lg bg-primary text-black font-semibold px-4 py-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70"
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

    {/* Bulk (x5) */}
    <div className="rounded-xl bg-black/30 ring-1 ring-white/10 p-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => buyStock(name, 5)}
          className="inline-flex items-center justify-center rounded-lg bg-primary text-black font-semibold px-4 py-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70"
        >
          Buy 5
        </button>
        <button
          type="button"
          onClick={() => sellStock(name, 5)}
          className="inline-flex items-center justify-center rounded-lg bg-white/10 text-white font-semibold px-4 py-2 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70"
        >
          Sell 5
        </button>
      </div>
    </div>
  </div>
)}




      {/* Chart */}
      <div className="w-full mt-4">
        {week !== 0 && (
          <div className="rounded-xl bg-black/30 ring-1 ring-white/10 p-2">
            <StockChart
              data={historical_prices}
              latestWeek={String(week)}
              latestSeason={season}
              medianPrice={medianPrice}
              eliminated={eliminated}
              homepage={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}



