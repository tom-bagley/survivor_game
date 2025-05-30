import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';
import Display from '../../components/playerdisplay/playerdisplay';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [priceData, setPriceData] = useState([]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const {data} = await axios.get('/players/allplayers');
        setPlayers(data);
      } catch (error) {
        console.log(error);
      }
    }

    fetchPlayers();
  }, []);

  useEffect(() => {
    if (players.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % players.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [players]);

  if (players.length === 0) return <div>Loading players...</div>;

  


  return (
    <div className="homepage">

      <div className="homepage-title">
        <img src="/logo.png" alt="Logo" className="logo" />
        <h1>
          Survivor Season 49 <br />
          Interactive Stock Game
        </h1>
      </div>
      <div className="homepage-wrapper">
        <div className="homepage-content">
          <p>
            Welcome to the Survivor Season 49 Stock Game! In this interactive experience, each player begins with $100 to invest in Survivor contestants. You can choose to put all your stock in one contestant or spread your investments across multiple players.
            <br /><br />
            Each week, as contestants are eliminated from the show, any stock you’ve invested in them will be lost. Survivor contestants with higher investments will see their stock prices rise, making them more expensive to buy—but also more valuable.
            <br /><br />
            The ultimate goal? Outplay, outlast, and outwit other players to end the game with the highest portfolio value. May the best strategist win!
          </p>
        </div>
        <div>
          <Display 
            key={players[currentIndex].name} 
            {...players[currentIndex]} 
            profilePhotoUrl={players[currentIndex].profile_pic} // override here
          />
        </div>
        
      </div>
    </div>
  );
}

