import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Tailwind-friendly custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const price = payload[0].value;

  return (
    <div className="rounded-lg bg-black/80 ring-1 ring-white/10 px-3 py-2 shadow-lg">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-sm font-semibold text-accent">${price.toFixed(2)}</div>
    </div>
  );
}

const StockChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const latestPrice = data[data.length - 1].price;
  const isUp = latestPrice >= 5;
  // match your @theme colors
  const upColor = "#2C5E3F";     // --color-green-dark
  const downColor = "#E63917";   // --color-red-flame
  const lineColor = isUp ? upColor : downColor;

  return (
    <div className="w-full rounded-2xl bg-black/30 ring-1 ring-white/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-base text-white/90">Price (last 10)</h3>
        <span className="text-xs text-white/60">
          Latest: <span className="font-semibold text-accent">${latestPrice?.toFixed?.(2)}</span>
        </span>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFC83D" stopOpacity={0.85} />  {/* accent */}
                <stop offset="95%" stopColor="#0E0E0E" stopOpacity={0.1} />  {/* black-bg */}
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={false}
              minTickGap={24}
            />

            <YAxis
              domain={[0, 10]}
              ticks={[0, 5, 10]}
              tickFormatter={(v) => `$${v}`}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={false}
              width={36}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />

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
  );
};

export default StockChart;
