import React from 'react';

export default function Introduction({ name, profilePhotoUrl, age, Hometown, Current_Residence, Occupation }) {
  return (
    <div className="flex gap-4 items-start bg-black/30 p-4 rounded-xl ring-1 ring-white/10">
      <div className="flex-shrink-0">
        <img src={profilePhotoUrl} alt="Profile" className="w-32 h-auto rounded-lg object-cover" />
      </div>
      <div className="text-white">
        <h4 className="text-xl font-bold">{name}</h4>
        <p>Age: {age}</p>
        <p>Hometown: {Hometown}</p>
        <p>Current Residence: {Current_Residence}</p>
        <p>Occupation: {Occupation}</p>
      </div>
    </div>
  );
}