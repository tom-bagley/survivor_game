import React, { useState, useEffect } from "react";
import axios from "axios";
import StockChart from "../stockChartDashboard/stockChartDashboard";

export default function Display({ name, profilePhotoUrl, isFading, eliminated, week, season, medianPrice }) {
  const [priceData, setPriceData] = useState([]);

  const [priceLoaded, setPriceLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchPrices() {
      setPriceLoaded(false);
      try {
        const { data } = await axios.get(`/players/${name}`);
        if (!cancelled) {
          setPriceData(data || []);
          setPriceLoaded(true);
        }
      } catch (e) {
        if (!cancelled) setPriceLoaded(true); 
      }
    }
    if (name) fetchPrices();
    return () => { cancelled = true; };
  }, [name]);


  const latestPrice = priceData.length ? priceData[priceData.length - 1].price : null;
  const maxPrice = medianPrice * 2;
  const highThreshold = maxPrice * 0.9; // 1.8 * median
  const lowThreshold  = maxPrice * 0.1; // 0.2 * median
  const isGood = latestPrice !== null && latestPrice > medianPrice;
  const showIcons = priceLoaded

  if (priceLoaded) {
  return (
    <div
      className={[
        // card shell
        "rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl p-5 sm:p-6 transition-opacity duration-500",
        "max-w-3xl mx-auto",
        isFading ? "opacity-0" : "opacity-100",
        eliminated ? "grayscale" : "",
      ].join(" ")}
    >
      {/* Header: name + status chips */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2">
          <span>{name}</span>
          {showIcons && !Number.isNaN(latestPrice) && latestPrice > highThreshold && (
            <span className="text-accent" aria-label="hot">🔥</span>
          )}
          {showIcons && !Number.isNaN(latestPrice) && latestPrice < lowThreshold && (
            <span aria-label="cold">❄️</span>
          )}
        </h2>

        <div className="flex items-center gap-2">
          {/* price pill */}
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
              latestPrice == null
                ? "bg-white/10 text-white/70"
                : isGood
                ? "bg-green-dark/20 text-green-dark"
                : "bg-red-flame/20 text-red-flame",
            ].join(" ")}
          >
            {latestPrice == null ? "—" : `$${latestPrice.toFixed(2)}`}
          </span>

          {/* eliminated pill */}
          {eliminated && (
            <span className="inline-flex items-center rounded-full bg-red-flame/25 text-red-flame px-3 py-1 text-xs font-semibold">
              Eliminated
            </span>
          )}
        </div>
      </div>
      {/* Content: avatar*/}
<div className="flex flex-col md:flex-row items-start gap-4 w-full">
  <div
    className={[
      "mx-auto md:mx-0",
      "relative w-40 sm:w-48 md:w-56 max-w-[300px]",
      "aspect-square md:aspect-[3/4] rounded-2xl overflow-hidden ring-2 shadow-lg", // was aspect-square
      eliminated
        ? "ring-red-flame/40"
        : isGood
        ? "ring-green-dark/50"
        : "ring-red-flame/50",
    ].join(" ")}
  >
    <img
      src={profilePhotoUrl}
      alt={`${name} headshot`}
      className="absolute inset-0 h-full w-full object-cover object-top"
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
  </div>



  {/* Chart (right) */}
  <div className="flex-1 min-w-0 w-full md:w-auto">
    <StockChart
      data={priceData}
      latestWeek={String(week)}
      latestSeason={season}
      medianPrice={medianPrice}
      eliminated={eliminated}
      homepage={true}
    />
  </div>
</div>


    </div>
  );
}
}
