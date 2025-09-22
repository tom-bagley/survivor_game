import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { UserContextProvider } from '../context/userContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <UserContextProvider>
        <App />
      </UserContextProvider>
    </Router>
  </StrictMode>
)

