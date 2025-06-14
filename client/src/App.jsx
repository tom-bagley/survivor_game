import './App.css'
import {Routes, Route} from 'react-router-dom';
import Navbar from '../src/components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { UserContextProvider } from '../context/userContext';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import DisplayPlayers from './pages/DisplayPlayers';
import DashboardPreSeason from './pages/DashboardPreSeason';
import Leaderboard from './pages/Leaderboard/Leaderboard'

if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'https://survivorseason48stockgame.onrender.com';
} else {
  axios.defaults.baseURL = 'http://localhost:8000'; 
}

axios.defaults.withCredentials = true;


function App() {
  return (
    <UserContextProvider>
    <Navbar />
    <Toaster position='bottom-right' toastOptions={{duration: 2000}} />
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/register' element={<Register />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/players' element={<Players />} />
      <Route path='/dashboardpreseason' element={<DashboardPreSeason />} />
      <Route path='/displayplayers' element={<DisplayPlayers />} />
      <Route path='/leaderboard' element={<Leaderboard />} />

    </Routes>
    </UserContextProvider>
  )
}

export default App
