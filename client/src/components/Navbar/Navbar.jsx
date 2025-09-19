import { NavLink, Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { UserContext } from "../../../context/userContext";

export default function Navbar() {
  const { user, setUser, replaceUser } = useContext(UserContext) || {};
  const [open, setOpen] = useState(false);                 // mobile menu
  const [profileOpen, setProfileOpen] = useState(false);   // desktop dropdown
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false); // mobile sub-menu
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const linkBase =
    "block px-4 py-2 rounded-lg font-medium hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/60";
  const getLink = ({ isActive }) =>
    `${linkBase} ${isActive ? "text-accent" : "text-white/90"}`;

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch {
    } finally {
      if (typeof replaceUser === "function") replaceUser(null);
      else if (typeof setUser === "function") setUser(null);
      navigate("/login");
    }
  };

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
                Meet the Cast
              </NavLink>
            </li>

            {user?.role === "admin" && (
              <li>
                <NavLink to="/admin" className={getLink}>
                  Admin
                </NavLink>
              </li>
            )}

            <li>
              <a 
                href="https://discord.gg/9V66vjHP" 
                className={getLink}
                target="_blank" 
                rel="noopener noreferrer"
              >
                Join Discord
              </a>
            </li>

            {user && (
              <>

                {/* Profile dropdown */}
<li className="relative" ref={dropdownRef}>
  <button
    type="button"
    onClick={() => setProfileOpen((v) => !v)}
    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white/90 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/60"
    aria-haspopup="menu"
    aria-expanded={profileOpen}
  >
    <span>Your Profile</span>
    <svg
      className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {profileOpen && (
    <div
      role="menu"
      className="absolute right-0 mt-2 w-56 rounded-lg bg-black/90 ring-1 ring-white/10 shadow-xl overflow-hidden"
    >
      <div className="px-4 py-3 text-sm text-white/70 border-b border-white/10">
        Signed in as{" "}
        <span className="text-white font-semibold">{user.name}</span>
      </div>
      <button
        role="menuitem"
        onClick={() => {
          setProfileOpen(false);
          navigate("/dashboard");
        }}
        className="block w-full text-left px-4 py-2 text-white hover:bg-primary/20"
      >
        Your Stock Portfolio
      </button>
      <button
        role="menuitem"
        onClick={() => {
          setProfileOpen(false);
          navigate("/change-username");
        }}
        className="block w-full text-left px-4 py-2 text-white hover:bg-primary/20"
      >
        Change Username
      </button>
      <button
        role="menuitem"
        onClick={handleLogout}
        className="block w-full text-left px-4 py-2 text-white hover:bg-red-500/20"
      >
        Logout
      </button>
    </div>
  )}
</li>
              </>
            )}

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
              Meet the Cast
            </NavLink>
          </li>
              <li>
              <a 
                href="https://discord.gg/9V66vjHP" 
                className={getLink}
                target="_blank" 
                rel="noopener noreferrer"
              >
                Join Discord
              </a>
            </li>

          {user?.role === "admin" && (
            <li>
              <NavLink to="/admin" className={getLink} onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            </li>
          )}

          {user && (
            <>
              {/* Mobile Profile group */}
<li className="pt-2">
  <button
    type="button"
    onClick={() => setMobileProfileOpen((v) => !v)}
    className="w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium text-white/90 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/60"
  >
    <span>Your Profile</span>
    <svg
      className={`h-4 w-4 transition-transform ${mobileProfileOpen ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {mobileProfileOpen && (
    <div className="mt-1 ml-2 space-y-1">
      <button
        onClick={() => {
          setOpen(false);
          navigate("/dashboard");
        }}
        className="w-full text-left px-4 py-2 rounded-lg text-white/90 hover:bg-white/5"
      >
        Your Stock Portfolio
      </button>
      <button
        onClick={() => {
          setOpen(false);
          navigate("/change-username");
        }}
        className="w-full text-left px-4 py-2 rounded-lg text-white/90 hover:bg-white/5"
      >
        Change Username
      </button>
      <button
        onClick={() => {
          setOpen(false);
          handleLogout();
        }}
        className="w-full text-left px-4 py-2 rounded-lg text-white/90 hover:bg-red-500/20"
      >
        Logout
      </button>
    </div>
  )}
</li>

            </>
          )}

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




