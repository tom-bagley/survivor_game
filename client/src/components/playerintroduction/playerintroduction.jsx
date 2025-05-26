import React from 'react';

const Introduction = ({ name, profilePhotoUrl, age, Hometown, Current_Residence, Occupation }) => {
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

export default Introduction;