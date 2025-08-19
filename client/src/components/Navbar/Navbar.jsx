import { NavLink, Link } from "react-router-dom";
import { useContext, useState } from "react";
import { UserContext } from "../../../context/userContext";

export default function Navbar() {
  const { user } = useContext(UserContext);
  const [open, setOpen] = useState(false);

  const linkBase =
    "block px-4 py-2 rounded-lg font-medium hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/60";
  const getLink = ({ isActive }) =>
    `${linkBase} ${isActive ? "text-accent" : "text-white/90"}`;

  return (
    <nav className="sticky top-0 z-40 bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/40 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-heading text-lg tracking-tight">
                <span className="text-primary">Survivor</span>{" "}
                <span className="text-accent">Stock Exchange</span>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-2">
            <li>
              <NavLink to="/rules" className={getLink} end onClick={() => setOpen(false)}>
                Rules
              </NavLink>
            </li>
            <li>
              <NavLink to="/displayplayers" className={getLink}>
                Season 50 Players
              </NavLink>
            </li>
            <li>
              <NavLink to="/leaderboard" className={getLink}>
                Leaderboard
              </NavLink>
            </li>

            {user?.role === "admin" && (
              <li>
                <NavLink to="/admin" className={getLink}>
                  Admin
                </NavLink>
              </li>
            )}

            {/* Only show if logged in */}
            {user && (
              <>
                <li>
                  <NavLink to="/dashboard" className={getLink}>
                    Your Stock Portfolio
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/logout" className={getLink}>
                    Logout
                  </NavLink>
                </li>
              </>
            )}

            {/* Only show if logged out */}
            {!user && (
              <li>
                <NavLink to="/login" className={getLink}>
                  Login/Sign Up
                </NavLink>
              </li>
            )}
          </ul>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-white/90 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/60"
          >
            <svg className={`h-6 w-6 ${open ? "hidden" : "block"}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <svg className={`h-6 w-6 ${open ? "block" : "hidden"}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden border-t border-white/10 ${open ? "block" : "hidden"}`}>
        <ul className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2 space-y-1">
          <li>
            <NavLink to="/" className={getLink} end onClick={() => setOpen(false)}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/rules" className={getLink} end onClick={() => setOpen(false)}>
              Rules
            </NavLink>
          </li>
          <li>
            <NavLink to="/displayplayers" className={getLink} onClick={() => setOpen(false)}>
              Season 50 Players
            </NavLink>
          </li>
          <li>
            <NavLink to="/leaderboard" className={getLink} onClick={() => setOpen(false)}>
              Leaderboard
            </NavLink>
          </li>

          {user?.role === "admin" && (
            <li>
              <NavLink to="/admin" className={getLink} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            </li>
          )}

          {/* Show when logged in */}
          {user && (
            <>
              <li>
                <NavLink to="/dashboard" className={getLink} onClick={() => setOpen(false)}>
                  Your Stock Portfolio
                </NavLink>
              </li>
              <li>
                <NavLink to="/logout" className={getLink} onClick={() => setOpen(false)}>
                  Logout
                </NavLink>
              </li>
            </>
          )}

          {/* Show when logged out */}
          {!user && (
            <li>
              <NavLink to="/login" className={getLink} onClick={() => setOpen(false)}>
                Login/Sign Up
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}



