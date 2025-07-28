import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../context/userContext";
import axios from "axios";
import {toast} from 'react-hot-toast';
import './episode_airing.css'

export default function Episode_Airing() {
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60);
  
  useEffect(() => {
  const fetchTimeLeft = async () => {
    const res = await axios.get('/episode/episode-end-time');
    console.log(res.data); // ISO timestamp string
    const endTime = new Date(res.data).getTime(); // milliseconds
    const now = Date.now(); // milliseconds
    const secondsLeft = Math.max(0, Math.floor((endTime - now) / 1000));
    setTimeLeft(secondsLeft);
  };

  fetchTimeLeft();
}, []);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  if (timeLeft === null) {
    return (
      <div className="page">
        <div className="clock-container">Loading...</div>
      </div>
    );
  }

  const formatTimeParts = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return [
      h.toString().padStart(2, "0"),
      m.toString().padStart(2, "0"),
      s.toString().padStart(2, "0"),
    ];
  };

  const [hours, minutes, seconds] = formatTimeParts(timeLeft);

  return (
    <div className="page">
      <div className="clock-container">
        <h1>Episode is Airing. Return in ...</h1>

        <div className="clock-timer">
            <div className="clock-unit">
                <div className="clock-number">{hours}</div>
                <div className="clock-label">Hours</div>
            </div>
            <div className="clock-unit">
                <div className="clock-number">{minutes}</div>
                <div className="clock-label">Minutes</div>
            </div>
            <div className="clock-unit">
                <div className="clock-number">{seconds}</div>
                <div className="clock-label">Seconds</div>
            </div>
        </div>
        </div>
    </div>
  );
}