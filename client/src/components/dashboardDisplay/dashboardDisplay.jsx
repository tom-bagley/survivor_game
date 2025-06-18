import React, { useState, useEffect } from 'react';
import './dashboardDisplay.css'
import StockChart from '../stockChartDashboard/stockChartDashboard';
import axios from 'axios';

const Display = ({ name, profilePhotoUrl, shares, price, holdingsValue, buyStock, sellStock, eliminated, season, week, historical_prices, medianPrice }) => {
    const latestPrice = historical_prices.length > 0 ? historical_prices[historical_prices.length - 1].price : null;
    const isGood = latestPrice !== null && latestPrice > medianPrice;

  return (
    <div className={`
            ${"container"} 
            ${isGood ? "good" : "bad"} 
            ${eliminated ? "eliminated" : ''}
          `}>
      <div className={"leftColumn"}>
        <img src={profilePhotoUrl} alt="Profile" className={"profilePicture"} />
      </div>
      <div className={"middleColumn"}>
        <h4>{name}</h4>
        <div className={"details"}>
          <p>Shares: {shares}</p>
          <p>Price: ${price.toFixed(2)}</p>
          <p>
            <span className={eliminated ? "redText" : ''}>
              {eliminated ? 'Total Lost' : 'Value'}
            </span>: ${holdingsValue.toFixed(2)}
          </p>
        </div>
        {!eliminated && (
          <div className={"buttons"}>
            <button onClick={() => buyStock(name)}>Buy 1</button>
            <button onClick={() => sellStock(name)}>Sell 1</button>
          </div>
        )}
      </div>
      <div className="rightColumn">
        {week !== 0 && (
          <StockChart 
            data={historical_prices} 
            latestWeek={String(week)} 
            latestSeason={season} 
            medianPrice={medianPrice} 
          />
        )}
      </div>
    </div>
  );
 };

export default Display;

