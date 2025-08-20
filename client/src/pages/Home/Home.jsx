import React, { useState, useEffect } from 'react';
import axios from 'axios';
// remove: import './Home.css';
import Display from '../../components/playerdisplay/playerdisplay';
import Login from '../../components/logindisplay/Login';
import Introduction from "../../components/playerintroduction/playerintroduction";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [week, setWeek] = useState(null);
  const [season, setSeason] = useState([]);
  const [medianPrice, setMedianPrice] = useState([]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data } = await axios.get('/players/allplayers');
        const { data: seasonData } = await axios.get('/admin/getcurrentseason');

        // Fisher–Yates shuffle
        const shuffled = [...(data || [])];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        setPlayers(shuffled);
        setCurrentIndex(0); // ensure we start at the first in the shuffled list
        setWeek(seasonData.currentWeek);
        setSeason(seasonData.seasonName);
        setMedianPrice(seasonData.currentPrice);
      } catch (error) {
        console.log(error);
      }
    }
    fetchPlayers();
  }, []);


  useEffect(() => {
    if (players.length === 0) return;

    const fadeTime = 500;   // sync with Tailwind duration-500
    const displayTime = 4000;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % players.length);
        setIsFading(false);
      }, fadeTime);
    }, displayTime);

    return () => clearInterval(interval);
  }, [players]);

  const isPreseason = week !== null && Number(week) === 0;

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-black-bg text-white flex items-center justify-center">
        <div className="w-full max-w-4xl px-6">
          <div className="mb-8">
            <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-3" />
            <div className="h-4 w-80 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-6 animate-pulse h-64" />
            <div className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-6 animate-pulse h-64" />
          </div>
        </div>
      </div>
    );
  }

  const player = players[currentIndex];

  return (
    <div className="min-h-screen bg-black-bg text-white">
      {/* Page Container */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Title / Hero */}
        <header className="mb-10 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo.jpg"
              alt="Survivor Stock Game Logo"
              className="h-32 w-auto sm:h-40 md:h-48 drop-shadow-xl"
            />
          </div>

          {/* Title
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl tracking-tight">
            <span className="text-primary">Survivor</span>{' '}
            <span className="text-accent">Stock Game</span>
          </h1> */}

          {/* Subtitle */}
          <p className="mt-3 text-base sm:text-lg text-white/80">
            Pick your favorites. Invest.{' '}
            <span className="text-primary font-semibold">Compete</span> with others.
          </p>
        </header>


{/* One-Column Layout */}
<div className="grid grid-cols-1 gap-8">
  {/* Rotating Player Display */}
  <section
    className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl p-6 lg:p-8 min-h-[700px]"
    aria-labelledby="spotlight-title"
  >
    <div
      className={[
        "transition-opacity duration-500",
        isFading ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      {isPreseason ? (
        <Introduction
          name={player?.name}
          profilePhotoUrl={player?.profile_pic}
          age={player?.age}
          Hometown={player?.Hometown}
          Current_Residence={player?.Current_Residence}
          Occupation={player?.Occupation}
          homepage={true}
        />
      ) : (
        <Display
          key={player?.name}
          {...player}
          profilePhotoUrl={player?.profile_pic}
          isFading={isFading}
          eliminated={!player?.availability}
          week={week}
          season={season}
          medianPrice={medianPrice}
        />
      )}
    </div>
  </section>
</div>


        {/* (Optional) Rules block — uncomment if you want it visible */}
        {false && (
          <section className="mt-10 rounded-2xl bg-black/30 ring-1 ring-white/10 p-6 lg:p-8">
            <h3 className="font-heading text-2xl mb-3">Rules</h3>
            <p className="text-white/80">
              Each player starts with <span className="text-accent font-semibold">$100</span> to invest in contestants.
              As contestants are eliminated, any stock you’ve invested in them is lost.
              Contestants with higher investment see their stock price rise. End with the
              highest portfolio value to win.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}


