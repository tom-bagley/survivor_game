import { useContext } from "react";
import { UserContext } from "../../context/userContext";
import axios from "axios";

export default function Dashboard() {
  const { user, setUser } = useContext(UserContext)
  
  const updatePortfolio = async (stock, action) => {
    try {
      const { data } = await axios.put('/updateportfolio', {
        userId: user.id,
        stock,
        action,
      });
      console.log(data);
      setUser(data);
    } catch (error) {
      console.log(error);
    }
  };

  const buyStock = (stock) => updatePortfolio(stock, 'buy');
  const sellStock = (stock) => updatePortfolio(stock, 'sell');
  
  return (
  <div>
  <h1>Dashboard</h1>
  {!!user && (
    <>
      <h2>Hi {user.name}!</h2>
      <h3>Your Portfolio</h3>
      <ul>
        {Object.keys(user.portfolio || {}).map((stock) => (
          <li key={stock}>
            {stock}: {user.portfolio[stock]} stocks
            <button onClick={() => buyStock(stock)}>Buy 1</button>
            <button onClick={() => sellStock(stock)}>Sell 1</button>
          </li>
        ))}
      </ul>
    </>
  )}
  </div>
  
  )
}