import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Tailwind-styled tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const price = Number(payload[0].value ?? 0);
  return (
    <div className="rounded-lg bg-black/80 ring-1 ring-white/10 px-3 py-2 shadow-lg">
      {label != null && <div className="text-xs text-white/60">{String(label)}</div>}
      <div className="text-sm font-semibold text-accent">${price.toFixed(2)}</div>
    </div>
  );
}

const StockChart = ({
  data = [],
  latestWeek,
  latestSeason,
  medianPrice = 0,
  eliminated,
  homepage,
}) => {
  // Default to "season" if homepage; otherwise "week"
  const [viewMode, setViewMode] = useState(homepage ? "season" : "week");

  // On homepage or for eliminated players, always show season view
  const isSeasonView = Boolean(homepage || eliminated || viewMode === "season");
  const canToggle = !homepage && !eliminated;

  const filteredData = (data || []).filter((d) => {
    if (!d) return false;
    if (homepage || eliminated) return d.season === latestSeason;
    return viewMode === "week"
      ? d.week === latestWeek && d.season === latestSeason
      : d.season === latestSeason;
  });

  const latestPrice =
    filteredData.length > 0 ? Number(filteredData[filteredData.length - 1].price ?? 0) : 0;

  const upColor = "#2C5E3F";
  const downColor = "#E63917";
  const lineColor = latestPrice >= Number(medianPrice || 0) ? upColor : downColor;

  if (!filteredData.length) {
    return (
      <div className="w-full rounded-xl bg-black/30 ring-1 ring-white/10 p-3 text-center text-sm text-white/60">
        No data
      </div>
    );
    }

  const domainMax = Math.max(Number(medianPrice) * 2);
  const numericMedian = Number(medianPrice)

  return (
    <div className="w-full">
      {/* Toggle (hidden on homepage and for eliminated players) */}
      {canToggle && (
        <div className="mb-2 flex items-center justify-end">
          <div className="inline-flex rounded-lg bg-black/30 ring-1 ring-white/10 p-1">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={[
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                viewMode === "week" ? "bg-primary text-black" : "text-white/80 hover:bg-white/10",
              ].join(" ")}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode("season")}
              className={[
                "ml-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                isSeasonView ? "bg-primary text-black" : "text-white/80 hover:bg-white/10",
              ].join(" ")}
            >
              Season
            </button>
          </div>
        </div>
      )}

      {/* Chart card */}
      <div className="rounded-xl bg-black/30 ring-1 ring-white/10 p-2 w-full">
        <div className="h-[250px] md:h-[300px] lg:h-[300px]">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFC83D" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#0E0E0E" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

              <XAxis
                dataKey="week"
                tick={isSeasonView ? { fill: "rgba(255,255,255,0.75)", fontSize: 12 } : false}
                padding={filteredData.length === 1 ? { left: 1, right: 300 } : { left: 20, right: 20 }}
                tickFormatter={(value) => (isSeasonView ? `Week ${value}` : "")}
                axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                tickLine={false}
                minTickGap={24}
              />

              <YAxis
                domain={[0, (dataMax) => Math.min(dataMax, domainMax)]} // hard max
                ticks={[0, numericMedian, Math.ceil(domainMax)]}         // ensure ticks are numeric
                tickFormatter={(v) => `$${Number(v).toFixed(2)}`}        // format as price
                tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }} // tick styling
                axisLine={{ stroke: "rgba(255,255,255,0.15)" }}          // axis line styling
                tickLine={false}                                        // remove tick lines
                width={40}                                              // width of Y axis
              />


              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />

              <Line
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StockChart;


