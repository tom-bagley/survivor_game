import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './stockchart.css';

const StockChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const latestPrice = data[data.length - 1].price;
  const lineColor = latestPrice >= 5 ? '#00cc66' : '#ff4444'; // green or red
  return (
    <div className="stock-chart-container">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00eaff" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#003366" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid className="stock-chart-grid" />
          <XAxis dataKey="date" tick={{ fill: '#ccc' }} />
          <YAxis 
            domain={[0, 10]} 
            ticks={[0, 5, 10]} 
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