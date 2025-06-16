import React, { useState, useEffect } from 'react';
import styles from './stockdisplay.module.css';
import StockChart from '../stockchart/stockchart';
import axios from 'axios';

const Display = ({ name, profilePhotoUrl, shares, price, holdingsValue, buyStock, sellStock, eliminated }) => {
    const [priceData, setPriceData] = useState([]);
  
    useEffect(() => {
      async function fetchPrices() {
        try {
          const { data } = await axios.get(`/players/${name}`);
          // console.log("Fetched data for", name, data);
          setPriceData(data);
        } catch (error) {
          console.log(error);
        }
      }
      fetchPrices();
    }, [name]);

    const latestPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : null;
    const isGood = latestPrice !== null && latestPrice > 5;

  return (
    <div className={`
            ${styles.container} 
            ${isGood ? styles.good : styles.bad} 
            ${eliminated ? styles.eliminated : ''}
          `}>
      <div className={styles.leftColumn}>
        <img src={profilePhotoUrl} alt="Profile" className={styles.profilePicture} />
      </div>
      <div className={styles.middleColumn}>
        <h4>{name}</h4>
        <div className={styles.details}>
          <p>Shares: {shares}</p>
          <p>Price: ${price.toFixed(2)}</p>
          <p>
            <span className={eliminated ? styles.redText : ''}>
              {eliminated ? 'Total Lost' : 'Value'}
            </span>: ${holdingsValue.toFixed(2)}
          </p>
        </div>
        {!eliminated && (
          <div className={styles.buttons}>
            <button onClick={() => buyStock(name)}>Buy 1</button>
            <button onClick={() => sellStock(name)}>Sell 1</button>
          </div>
        )}
      </div>
      <div className={styles.rightColumn}>
        <StockChart data={priceData} />
      </div>
    </div>
  );
};

export default Display;

