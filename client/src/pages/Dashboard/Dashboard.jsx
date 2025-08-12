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
  const [week, setWeek] = useState([]);
  const [medianPrice, setMedianPrice] = useState([]);
  const [admin, setAdmin] = useState([]);

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
      setWeek(seasonData.week);
      setSeason(seasonData.season);
      setMedianPrice(seasonData.price);
      setBudget(financialData.budget);
      setNetWorth(financialData.netWorth);
      setSharesOwned(financialData.portfolio);
      setPrices(pricesData);
      setLeaderboard(leaderboardRank);
      setSurvivorPlayerStats(survivorsMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFinancials(false);
    }
  }

  getData();
  }, [loading, user]);

  if (!user?.id) return <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '2rem'
    }}>
        Not Logged In
    </div>;

  if (loading || loadingFinancials) return <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '2rem'
        }}>
            Loading!
        </div>;

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





