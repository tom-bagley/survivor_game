import React, { useState, useEffect } from 'react';
import styles from './playerdisplay.module.css';
import StockChart from '../stockchart/stockchart';
import axios from 'axios';

const Display = ({ name, profilePhotoUrl }) => {
  const [priceData, setPriceData] = useState([]);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const { data } = await axios.get(`/players/${name}`);
        console.log("Fetched data for", name, data);
        setPriceData(data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchPrices();
  }, [name]); 

  
    return (
        <div className={styles.container}>
          <h4 className={styles.name}>{name}</h4>
          <div className={styles.bottomRow}>
            <div className={styles.profilepicture}>
              <img src={profilePhotoUrl} alt="Profile" />
            </div>
            <div className={styles.chart}>
              <StockChart data = {priceData}/>
            </div>
          </div>
        </div>
    );      
};

export default Display;