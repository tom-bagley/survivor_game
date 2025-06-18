import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './stockChartDashboard.css';

const StockChart = ({ data, latestWeek, latestSeason, medianPrice }) => {
  console.log(data)
  console.log(latestWeek)
  console.log(latestSeason)
  const [viewMode, setViewMode] = useState('week');

    const filteredData = data.filter(d =>
        viewMode === 'week'
        ? d.week === latestWeek && d.season === latestSeason
        : d.season === latestSeason
    );
  console.log(filteredData)
  const toggleView = () => {
    setViewMode(prev => (prev === 'week' ? 'season' : 'week'));
  };
  if (!filteredData || filteredData.length === 0) return <div>nothing</div>;

  const latestPrice = filteredData[filteredData.length - 1].price;
  const lineColor = latestPrice >= 5 ? '#00cc66' : '#ff4444';

  return (
    <div className="stock-chart-container">
      <div className="toggle-buttons">
        <button
            className={viewMode === 'week' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => setViewMode('week')}
        >
            Week
        </button>
        <button
            className={viewMode === 'season' ? 'toggle-button active' : 'toggle-button'}
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
          <XAxis dataKey="date" tick={{ fill: '#ccc' }} />
          <YAxis 
            domain={[0, medianPrice * 2]} 
            ticks={[0, medianPrice, (medianPrice * 2)]} 
            tickFormatter={(value) => `$${value}`} 
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