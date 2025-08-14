import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../context/userContext";
import axios from "axios";
import {toast} from 'react-hot-toast';
import styles from './dashboard.module.css';
import Display from '../../components/dashboardDisplay/dashboardDisplay';
import EliminationSequence from "../../components/EliminationSequence";

export default function Dashboard() {
  const { user, loading } = useContext(UserContext);
  const [budget, setBudget] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [prevNetWorth, setPrevNetWorth] = useState(null);
  const [sharesOwned, setSharesOwned] = useState({});
  const [survivorPlayerStats, setSurvivorPlayerStats] = useState({});
  const [prices, setPrices] = useState({});
  const [leaderboard, setLeaderboard] = useState({});
  const [loadingFinancials, setLoadingFinancials] = useState(true);
  const [season, setSeason] = useState([]);
  const [week, setWeek] = useState(null);
  const [medianPrice, setMedianPrice] = useState([]);
  const [admin, setAdmin] = useState([]);
  const [lastSeenWeek, setLastSeenWeek] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [eliminatedSurvivors, setEliminatedSurvivors] = useState([]);

  useEffect(() => {
    if (loading || !user?.id) return;
    async function getData() {
      try {
        const [
          { data: financialData },
          { data: pricesData },
          { data: survivorPlayersData },
          { data: leaderboardRank },
          { data: seasonData },
          { data: episodeData },
        ] = await Promise.all([
          axios.get('/transactions/getportfolio', { params: { userId: user.id } }),
          axios.get('/transactions/getprices'),
          axios.get('/transactions/getprofile'),
          axios.get(`/leaderboard/getleaderboard/${user.id}`),
          axios.get('/admin/getcurrentseason'),
          axios.get('/episode/getcurrentepisode'),
        ]);

        const survivorsMap = survivorPlayersData.reduce((acc, player) => {
          acc[player.name] = player;
          return acc;
        }, {});

        setAdmin(seasonData);
        setWeek(seasonData.currentWeek);
        setSeason(seasonData.seasonName);
        setMedianPrice(seasonData.currentPrice);
        setBudget(financialData.user.budget);
        setNetWorth(financialData.user.netWorth);
        setSharesOwned(financialData.user.portfolio);
        setPrices(pricesData);
        setLeaderboard(leaderboardRank);
        setSurvivorPlayerStats(survivorsMap);
        setLastSeenWeek(financialData.user.last_seen_episode_id);
        setEliminatedSurvivors(episodeData.survivorsVotedOut);
        setPrevNetWorth(financialData.prevNetWorth);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingFinancials(false);
      }
    }

  getData();
  }, [loading, user]);

  useEffect(() => {
    const updateLastSeen = async () => {
    if (loading || week == null || lastSeenWeek == null) return; 

    if (lastSeenWeek !== week) {
      setShowAnimation(true);
      try {
        await axios.put(`/episode/updatelastseenepisode/${user.id}`);
      } catch (error) {
        console.error("Failed to update last seen episode:", error);
      }
    }
  };

  updateLastSeen();
  }, [loading, week, lastSeenWeek, user]);

  useEffect(() => {
    if (loading) return;
    if (showAnimation) {
      playEpisodeAnimation(() => setShowAnimation(false), Object.keys(eliminatedSurvivors).length);
    }
  }, [loading, showAnimation, eliminatedSurvivors]);

  function playEpisodeAnimation(onComplete, survivorCount) {
    console.log("Playing episode animation!");
    
    const SURVIVOR_STAGE_DELAY = 3000;
    const FINAL_STAGE_DELAY = 3000;
    
    const totalTime = (survivorCount * SURVIVOR_STAGE_DELAY) + FINAL_STAGE_DELAY;

    setTimeout(() => {
      console.log("Animation complete!");
      onComplete();
    }, totalTime);
  }

  // For "Not Logged In"
if (!user?.id) return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    color: '#333',
  }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#6c757d" viewBox="0 0 16 16">
      <path d="M10 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
      <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-6a6 6 0 0 0-4.472 10.085C4.584 10.97 6.203 10 8 10s3.416.97 4.472 2.085A6 6 0 0 0 8 2z"/>
    </svg>
    <h1 style={{ fontSize: '2rem', marginTop: '1rem' }}>You’re not logged in</h1>
    <p style={{ color: '#6c757d' }}>Please sign in to continue</p>
  </div>
);

// For "Loading"
if (loading || loadingFinancials) return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '4px solid #dee2e6',
      borderTop: '4px solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <h1 style={{ fontSize: '1.5rem', marginTop: '1rem', color: '#007bff' }}>Loading...</h1>

    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

  const updatePortfolio = async (survivorPlayer, action) => {
    try {
      const endpoint = week === 0 
        ? '/transactions/updateportfoliopreseason' 
        : '/transactions/updateportfolio';

      const { data } = await axios.put(endpoint, {
        userId: user.id,
        survivorPlayer,
        action,
      });

      if (data.error) {
        toast.error(data.error);
      } else {
        resetPrices();
        // getProfilePics();
        setSharesOwned(data.portfolio);
        setBudget(data.budget);
        setNetWorth(data.netWorth);
      }
    } catch (error) {
      toast.error('test');
    }
  };

  const buyStock = (survivorPlayer) => updatePortfolio(survivorPlayer, 'buy');
  const sellStock = (survivorPlayer) => updatePortfolio(survivorPlayer, 'sell');

  const resetPrices = async () => {
    try {
      const {data} = await axios.get('/transactions/getprices');
      setPrices(data);
    } catch (error) {
      console.log(error);
    }
  }

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(budget);

  const formattedNetWorth = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(netWorth);

  return (
    <>
      {showAnimation && (
      <EliminationSequence
        // showAnimation={showAnimation}
        week={week}
        eliminatedSurvivors={eliminatedSurvivors}
        survivorPlayerStats={survivorPlayerStats}
        sharesOwned={sharesOwned}
        prices={prices}
        medianPrice={medianPrice}
        prevNetWorth={prevNetWorth}
        netWorth={netWorth}
      />
      )}
    
    
    <div className = {styles.body}>
       <div className= {styles.header}>
        <h1>Welcome, {user.name}!</h1>
        <div className= {styles["financial-info"]}>
          <h2>Your Budget: {formattedBudget}</h2>
          <h2>Your Net Worth: {formattedNetWorth}</h2>
          <h2>Your Rank: {leaderboard}th</h2>
        </div>
      </div>
      <div>
        <h2 className={styles["portfolio-title"]}>Your Portfolio</h2>
      </div>
      <div className={styles["grid-container"]}>
        {Object.keys(sharesOwned).map((survivorPlayer) => {
          const survivor = survivorPlayerStats[survivorPlayer];

          const profile_pic = survivor.profile_pic
          const shares = sharesOwned[survivorPlayer];
          const price = prices[survivorPlayer];
          const displayPrice = week === 0 ? medianPrice : price;
          const holdingsValue = shares * displayPrice;
          const eliminated = !survivor.availability;
          const historical_prices = survivor.historicalprices
  
          return (
            <Display
              key={survivorPlayer}
              name={survivorPlayer}
              profilePhotoUrl={profile_pic}
              shares={shares}
              price={week === 0 ? medianPrice : price}
              holdingsValue={holdingsValue}
              buyStock={buyStock}
              sellStock={sellStock}
              eliminated={eliminated}
              season={season}
              week={week}
              historical_prices={historical_prices}
              medianPrice={medianPrice}
            />
          );
        })}
      </div> 
    </div>
    </>
  );

  
  
  
}





