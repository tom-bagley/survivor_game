import React from 'react';
import styles from './playerdisplay.module.css';
import StockChart from '../stockchart/stockchart';

const Display = ({ name, profilePhotoUrl, age, Hometown, Current_Residence, Occupation }) => {
    return (
        <div className={styles.container}>
          <h4 className={styles.name}>{name}</h4>
          <div className={styles.bottomRow}>
            <div className={styles.profilepicture}>
              <img src={profilePhotoUrl} alt="Profile" />
            </div>
            <div className={styles.chart}>
              <StockChart />
            </div>
          </div>
        </div>
    );      
};

export default Display;