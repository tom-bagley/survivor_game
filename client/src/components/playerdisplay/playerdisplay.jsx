import React, { useState, useEffect } from 'react';
import styles from './playerdisplay.module.css';
import StockChart from '../stockchart/stockchart';
import axios from 'axios';

const Display = ({ name, profilePhotoUrl, isFading, eliminated }) => {
  const [priceData, setPriceData] = useState([]);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const { data } = await axios.get(`/players/${name}`);
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
        ${isFading ? styles.fadeOut : styles.fadeIn} 
        ${isGood ? styles.good : styles.bad} 
        ${eliminated ? styles.eliminated : ''}
      `}>
        <h2 className={styles.name}>
          {name}
          {latestPrice > 9 && <span className={styles.emoji}>🔥</span>}
          {latestPrice < 1 && <span className={styles.emoji}>❄️</span>}
        </h2>
        <div className={styles.content}>
          <div className={`${styles.avatarWrapper} ${isGood ? styles.good : styles.bad}`}>
            <img src={profilePhotoUrl} alt="Profile" className={styles.avatar} />
          </div>
          <div className={styles.chartContainer}>
            <StockChart data={priceData} />
          </div>
        </div>
      </div>
    );     
};

export default Display;