import './App.css'
import {Routes, Route} from 'react-router-dom';
import Navbar from '../src/components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { useContext, useEffect, useState } from 'react';
import { UserContextProvider, UserContext } from '../context/userContext';
import { useNavigate } from "react-router-dom";
import Dashboard from './pages/Dashboard/Dashboard';
import Admin from './pages/Admin/Admin';
import DisplayPlayers from './pages/DisplayPlayers';
import Leaderboard from './pages/Leaderboard/Leaderboard'
import Episode_Airing from './pages/Episode Airing Stopgap/episode_airing';

if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'https://survivorseason48stockgame.onrender.com';
} else {
  axios.defaults.baseURL = 'http://localhost:8000'; 
}

axios.defaults.withCredentials = true;

const RequireAdmin = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '2rem'
        }}>
            Loading!
        </div>;
  if (!user || user.role !== 'admin') return <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '2rem'
        }}>
            Not Admin
        </div>;

  return children;
}

function App() {
  return (
    <UserContextProvider>
    <Navbar />
    <Toaster position='bottom-right' toastOptions={{duration: 2000}} />
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/register' element={<Register />} />
      <Route path='/dashboard' element={<Dashboard />}/>
      <Route path='/displayplayers' element={<DisplayPlayers />}/>
      <Route path='/leaderboard' element={<Leaderboard />} />
      <Route path='/on-air' element={<Episode_Airing />} />
      <Route
        path='/admin'
        element={
          <RequireAdmin>
            <Admin />
          </RequireAdmin>
        }
      />

    </Routes>
    </UserContextProvider>
  )
}

export default App
