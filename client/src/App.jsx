import './App.css'
import {Routes, Route} from 'react-router-dom';
import Navbar from '../src/components/Navbar/Navbar';
// import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../context/userContext';
import { useNavigate } from "react-router-dom";
import Dashboard from './pages/Dashboard/Dashboard';
import Admin from './pages/Admin/Admin';
import DisplayPlayers from './pages/DisplayPlayers';
import Leaderboard from './pages/Leaderboard/Leaderboard'
import Episode_Airing from './pages/Episode Airing Stopgap/episode_airing';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Rules from './pages/Rules';
import ChangeUsername from './pages/ChangeUsername';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import JoinGroup from './pages/joinGroup';

if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'https://survivorstockexchange.com';
}
 else {
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
    <>
      <Navbar />
      <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
      <Routes>
        <Route path='/' element={<AppLayout />}>
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='on-air' element={<Episode_Airing />} />
        </Route>

        <Route path='/login' element={<Login />} />
        <Route path='/logout' element={<Logout />} />
        <Route path='/register' element={<Register />} />
        <Route path='/displayplayers' element={<DisplayPlayers />} />
        <Route path='/leaderboard' element={<Leaderboard />} />

        <Route
          path='/admin'
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />

        <Route path='/rules' element={<Rules />} />
        <Route path='/change-username' element={<ChangeUsername />} />
        <Route path='/change-password' element={<ForgotPassword />} />
        <Route path='/reset-password/:token' element={<ResetPassword />} />
        <Route path='/join-group/:token' element={<JoinGroup />} />
      </Routes>
    </>
  );
}

export default App
