import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function AppLayout() {
  const [onAir, setOnAir] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOnAirStatus = async () => {
      try {
        const res = await axios.get('/episode/getcurrentepisode');
        setOnAir(res.data.onAir);
      } catch (err) {
        console.error("Failed to fetch onAir status:", err);
      }
    };
    fetchOnAirStatus();
    const intervalId = setInterval(fetchOnAirStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (onAir !== null) {
      navigate("/dashboard", { replace: true });
    }
  }, [onAir, navigate]);

  return <Outlet />; // renders the child route component
}

export default AppLayout;