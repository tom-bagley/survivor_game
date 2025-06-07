import './Navbar.css';
import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav className="navbar">
      <ul className="nav-left">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/displayplayers">Season 48 Players</Link></li>
        <li><Link to="/leaderboard">Leaderboard</Link></li>
      </ul>
      <ul className="nav-right">
        {/* <li><Link to="/login">Login</Link></li>
        <li><Link to="/register">Register</Link></li> */}
        <li><Link to="/dashboard">Your Stock Portfolio</Link></li>
      </ul>
    </nav>
  );
}
