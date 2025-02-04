import React from 'react';
import styles from './playerdisplay.module.css';

const Display = ({ name, profilePhotoUrl, age, Hometown, Current_Residence, Occupation }) => {
    /*console.log(profilePhotoUrl);
    console.log(stock);
    console.log(age);
    console.log(Hometown);*/
    return (
        <div className={styles.container}>
          <div className={styles.profilepicture}>
            <img src={profilePhotoUrl} alt="Profile" />
          </div>
          <div className={styles.details}>
            <h4>{name}</h4>
            <p>Age: {age}</p>
            <p>Hometown: {Hometown}</p>
            <p>Current Residence: {Current_Residence}</p>
            <p>Occupation: {Occupation}</p>
          </div>
        </div>
      );
      
      
      
      
};

export default Display;