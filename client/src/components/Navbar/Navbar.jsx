import './Navbar.css';
import { Link } from "react-router-dom"
import { useContext, useState } from 'react';
import { UserContext } from "../../../context/userContext";

export default function Navbar() {
  const { user } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };
  return (
    <nav className="navbar">
      <button 
        className="menu-toggle" 
        aria-label="Toggle menu" 
        onClick={toggleMenu}
      >
        &#9776;
      </button>
      <ul className={`nav-menu ${menuOpen ? 'show' : ''}`}>
        <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
        <li><Link to="/displayplayers" onClick={() => setMenuOpen(false)}>Season 48 Players</Link></li>
        <li><Link to="/leaderboard" onClick={() => setMenuOpen(false)}>Leaderboard</Link></li>
        {user?.role === 'admin' && (
          <li><Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link></li>
        )}
        <li><Link to="/dashboard" onClick={() => setMenuOpen(false)}>Your Stock Portfolio</Link></li>
      </ul>
    </nav>
  );
}
