import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './stockchart.css';

const fakeData = [
  { date: '2025-05-19', price: 130 },
  { date: '2025-05-20', price: 132 },
  { date: '2025-05-21', price: 128 },
  { date: '2025-05-22', price: 135 },
  { date: '2025-05-23', price: 138 },
  { date: '2025-05-24', price: 137 },
  { date: '2025-05-25', price: 140 },
];

const StockChart = ({ data = fakeData }) => (
  <div className="stock-chart-container">
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default StockChart;