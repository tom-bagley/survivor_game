import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../context/userContext";
import axios from "axios";
import {toast} from 'react-hot-toast';
import styles from './dashboard.module.css';
import Display from '../../components/dashboardDisplay/dashboardDisplay';

export default function Dashboard() {
  const { user, loading } = useContext(UserContext);
  const [budget, setBudget] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
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
        ] = await Promise.all([
          axios.get('/transactions/getportfolio', { params: { userId: user.id } }),
          axios.get('/transactions/getprices'),
          axios.get('/transactions/getprofile'),
          axios.get(`/leaderboard/getleaderboard/${user.id}`),
          axios.get('/admin/getcurrentseason'),
        ]);

        const survivorsMap = survivorPlayersData.reduce((acc, player) => {
          acc[player.name] = player;
          return acc;
        }, {});

        setAdmin(seasonData);
        setWeek(seasonData.currentWeek);
        setSeason(seasonData.seasonName);
        setMedianPrice(seasonData.currentPrice);
        setBudget(financialData.budget);
        setNetWorth(financialData.netWorth);
        setSharesOwned(financialData.portfolio);
        setPrices(pricesData);
        setLeaderboard(leaderboardRank);
        setSurvivorPlayerStats(survivorsMap);
        setLastSeenWeek(financialData.last_seen_episode_id);
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
    if (loading) return
    if (showAnimation) {
      playEpisodeAnimation(() => setShowAnimation(false));
    }
  }, [loading, showAnimation]);

  function playEpisodeAnimation(onComplete) {
    console.log("Playing episode animation!");
    setTimeout(() => {
      console.log("Animation complete!");
      onComplete();
    }, 3000);
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

if (showAnimation) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'black',
        color: 'white',
        fontFamily: 'sans-serif',
      }}>
        <h1 style={{
          fontSize: '3rem',
          animation: 'fadeIn 1s ease-in-out'
        }}>
          Episode 5: The Showdown
        </h1>
        <p style={{
          opacity: 0.7,
          animation: 'fadeIn 2s ease-in-out',
          animationDelay: '1s',
          animationFillMode: 'forwards'
        }}>
          Viewers: {budget} | Likes: {netWorth}
        </p>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }


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
  );

  
  
  
}





