import React from 'react';
import styles from './stockdisplay.module.css';

const Display = ({ stock, profilePhotoUrl, shares, price, holdingsValue, buyStock, sellStock }) => {
  return (
    <div className={styles.container}>
      <div className={styles.profilepicture}>
        <img src={profilePhotoUrl} alt="Profile" />
      </div>
      <h4>{stock}</h4>
      <div className={styles.details}>
        <p>Shares: {shares}</p>
        <p>Price: ${price}</p>
        <p>Value: ${holdingsValue}</p>
      </div>
      <div className={styles.buttons}>
        <button onClick={() => buyStock(stock)}>Buy 1</button>
        <button onClick={() => sellStock(stock)}>Sell 1</button>
      </div>
    </div>
  );
};

export default Display;

