import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/userContext";
import axios from "axios";
import {toast} from 'react-hot-toast';
import Display from '../components/stockdisplay/stockdisplay';

export default function DashboardPreSeason() {
  const { user, setUser } = useContext(UserContext);
  const [userName, setUserName] = useState({});
  const [budget, setBudget] = useState({});
  const [netWorth, setNetWorth] = useState({});
  const [stocks, setStocks] = useState({});

  const [loading, setLoading] = useState(true);

  const updatePortfolio = async (stock, action) => {
    try {
      const { data } = await axios.put('/transactions/updateportfoliopreseason', {
        userId: user.id,
        stock,
        action,
      });
      if(data.error) {
        toast.error(data.error)
      } else {
        setStocks(data.portfolio);
        setBudget(data.budget);
      }
    } catch (error) {
      toast.error('test');
    }
  };

  const displayPlayers = async () => {
    try {
      const { data } = await axios.get('/transactions/getportfolio', { params: { userId: user.id } });
      setStocks(data.portfolio);
      setUserName(data.name);
      setBudget(data.budget);
      setNetWorth(data.netWorth);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const buyStock = (stock) => updatePortfolio(stock, 'buy');
  const sellStock = (stock) => updatePortfolio(stock, 'sell');

  useEffect(() => {
    if (user?.id) { 
      displayPlayers();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
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
    <div>
      <div className="header">
        <h1>Welcome, {userName}!</h1>
        <div className="financial-info">
          <h2>Your Budget: {formattedBudget}</h2>
          <h2>Your Net Worth: {formattedNetWorth}</h2>
        </div>
        <h2 className="portfolio-title">Your Portfolio</h2>
      </div>
  
      {/* Grid container */}
      <div className="grid-container">
        {Object.keys(stocks).map((stock) => {
          const shares = stocks[stock];
          const price = 1.00; // Use 1.00 as default price
          const holdingsValue = shares * price;
  
          return (
            <Display
              key={stock}
              stock={stock}
              shares={shares}
              price={price}
              holdingsValue={holdingsValue}
              buyStock={buyStock}
              sellStock={sellStock}
            />
          );
        })}
      </div>
    </div>
  );
  
}