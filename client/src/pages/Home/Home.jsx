import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';
import Display from '../../components/playerdisplay/playerdisplay';
import Login from '../../components/logindisplay/Login';

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
        <h2>Pick Your Favortites. Invest. Compete With Others.</h2>
      </div>
      <div className="row">
        <div className='column'>
          <Login></Login>
        </div>
        <div className='column'>
          <div className='display'>
            <Display 
              key={players[currentIndex].name} 
              {...players[currentIndex]} 
              profilePhotoUrl={players[currentIndex].profile_pic} // override here
            />
          </div>
        </div>
      </div>
      <div>
        <div className='rules'>
        <h1>Rules</h1>
          <p>
            Welcome to the Survivor Season 50 Stock Game! In this interactive experience, each player begins with $100 to invest in Survivor contestants. You can choose to put all your stock in one contestant or spread your investments across multiple players.
            <br /><br />
            Each week, as contestants are eliminated from the show, any stock you’ve invested in them will be lost. Survivor contestants with higher investments will see their stock prices rise, making them more expensive to buy—but also more valuable.
            <br /><br />
            The ultimate goal? Outplay, outlast, and outwit other players to end the game with the highest portfolio value. May the best strategist win!
          </p>
          </div>
        </div>
    </div>
    
  );
}

