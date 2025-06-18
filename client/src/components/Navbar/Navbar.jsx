import './Navbar.css';
import { Link } from "react-router-dom"
import { useContext } from 'react';
import { UserContext } from "../../../context/userContext";

export default function Navbar() {
  const { user } = useContext(UserContext);
  return (
    <nav className="navbar">
      <ul className="nav-left">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/displayplayers">Season 48 Players</Link></li>
        <li><Link to="/leaderboard">Leaderboard</Link></li>
        {user?.role === 'admin' && (
          <Link to="/admin">Admin</Link>
        )}
      </ul>
      <ul className="nav-right">
        {/* <li><Link to="/login">Login</Link></li>
        <li><Link to="/register">Register</Link></li> */}
        <li><Link to="/dashboard">Your Stock Portfolio</Link></li>
      </ul>
    </nav>
  );
}
