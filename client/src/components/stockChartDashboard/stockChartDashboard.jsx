import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './stockChartDashboard.css';

const StockChart = ({ data, latestWeek, latestSeason, medianPrice, eliminated }) => {
  const [viewMode, setViewMode] = useState('week');

  // Determine if chart is effectively in season view
  const isSeasonView = eliminated || viewMode === 'season';

  const filteredData = data.filter(d => {
    // Eliminated players always use season data
    if (eliminated) return d.season === latestSeason;

    // Otherwise, filter by viewMode
    return viewMode === 'week'
      ? d.week === latestWeek && d.season === latestSeason
      : d.season === latestSeason;
  });

  const latestPrice = filteredData.length > 0 ? filteredData[filteredData.length - 1].price : 0;
  const lineColor = latestPrice >= medianPrice ? '#00cc66' : '#ff4444';

  if (!filteredData || filteredData.length === 0) return <div>nothing</div>;

  return (
    <div className="stock-chart-container">
      <div className="toggle-buttons">
        <button
          className={!eliminated && viewMode === 'week' ? 'toggle-button active' : 'toggle-button'}
          onClick={() => !eliminated && setViewMode('week')}
          disabled={eliminated}
        >
          Week
        </button>
        <button
          className={isSeasonView ? 'toggle-button active' : 'toggle-button'}
          onClick={() => setViewMode('season')}
        >
          Season
        </button>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00eaff" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#003366" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid className="stock-chart-grid" />
          <XAxis
            dataKey="week"
            tick={isSeasonView ? { fill: '#ccc' } : false}
            padding={filteredData.length === 1 ? { left: 1, right: 300 } : { left: 20, right: 20 }}
            tickFormatter={(value) => {
              if (!isSeasonView) return '';
              return `Week ${value}`; // Convert week numbers to labels
            }}
          />

          <YAxis 
            domain={[0, medianPrice * 2]} 
            ticks={[0, medianPrice, medianPrice * 2]} 
            tickFormatter={(value) => `$${value.toFixed(2)}`} 
            tick={{ fill: '#ccc' }} 
          />
          <Tooltip 
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
            contentStyle={{
              backgroundColor: '#222',
              border: 'none',
              borderRadius: 8
            }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#00eaff' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
