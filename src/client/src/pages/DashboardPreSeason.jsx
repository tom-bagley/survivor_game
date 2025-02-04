import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/userContext";
import axios from "axios";
import { toast } from 'react-hot-toast';
import Display from '../components/stockdisplay/stockdisplay';

export default function DashboardPreSeason() {
  const { user, setUser } = useContext(UserContext);
  const [userName, setUserName] = useState("");
  const [budget, setBudget] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [stocks, setStocks] = useState({});
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true); // Add loading state

  const updatePortfolio = async (stock, action) => {
    try {
      const { data } = await axios.put('/transactions/updateportfoliopreseason', {
        userId: user.id,
        stock,
        action,
      });
      if (data.error) {
        toast.error(data.error);
      } else {
        getProfilePics();
        setStocks(data.portfolio);
        setBudget(data.budget);
      }
    } catch (error) {
      toast.error('An error occurred while updating the portfolio.');
    }
  };

  const displayPlayers = async () => {
    try {
      const { data } = await axios.get('/transactions/getportfolio', { params: { userId: user.id } });
      setStocks(data.portfolio || {});
      setUserName(data.name || "");
      setBudget(data.budget || 0);
      setNetWorth(data.netWorth || 0);
    } catch (error) {
      console.log(error);
    }
  };

  const buyStock = (stock) => updatePortfolio(stock, 'buy');
  const sellStock = (stock) => updatePortfolio(stock, 'sell');

  const getProfilePics = async () => {
    try {
      const { data } = await axios.get('/transactions/getprofile');
      setProfiles(data || {});
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        try {
          await Promise.all([displayPlayers(), getProfilePics()]);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false); // Set loading to false after data is fetched
        }
      };
      fetchData();
    }
  }, [user]);

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(budget);

  const formattedNetWorth = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(netWorth);

  if (loading) {
    return <div>Refresh the page</div>; // Display loading indicator
  }

  return (
    <div>
      <div className="header">
        <h1>Welcome, {userName}!</h1>
        <div className="financial-info">
          <h2>Your Budget: {formattedBudget}</h2>
          <h2>Your Net Worth: {formattedNetWorth}</h2>
        </div>
      </div>
      <div>
        <h2 className="portfolio-title">Your Portfolio</h2>
      </div>
      <div className="grid-container">
        {Object.keys(stocks).length > 0 ? (
          Object.keys(stocks).map((stock) => {
            const profile = profiles[stock];
            const shares = stocks[stock];
            const price = 1.00; // Use 1.00 as default price
            const holdingsValue = shares * price;

            return (
              <Display
                key={stock}
                stock={stock}
                profilePhotoUrl={profile}
                shares={shares}
                price={price}
                holdingsValue={holdingsValue}
                buyStock={buyStock}
                sellStock={sellStock}
              />
            );
          })
        ) : (
          <p>No stocks in your portfolio.</p>
        )}
      </div>
    </div>
  );
}