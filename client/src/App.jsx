import './App.css'
import {Routes, Route} from 'react-router-dom';
import Navbar from '../src/components/Navbar/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { UserContextProvider } from '../context/userContext';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import DisplayPlayers from './pages/DisplayPlayers';
import DashboardPreSeason from './pages/DashboardPreSeason';

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

function App() {
  return (
    <UserContextProvider>
    <Navbar />
    <Toaster position='bottom-right' toastOptions={{duration: 2000}} />
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/register' element={<Register />} />
      <Route path='/login' element={<Login />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/players' element={<Players />} />
      <Route path='/dashboardpreseason' element={<DashboardPreSeason />} />
      <Route path='/displayplayers' element={<DisplayPlayers />} />
    </Routes>
    </UserContextProvider>
  )
}

export default App
