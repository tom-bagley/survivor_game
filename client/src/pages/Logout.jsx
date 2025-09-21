// src/pages/Auth/Logout.jsx
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import { createGuest } from "../utils/guest";

export default function Logout() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(true);

  useEffect(() => {
    const performLogout = async () => {
      try {
        // 1️⃣ Remove auth tokens
        localStorage.removeItem("authToken");
        sessionStorage.removeItem("authToken");

        // 2️⃣ Clear any saved guest info
        sessionStorage.removeItem("guest_user");

        // 3️⃣ Create a new guest user for this session
        const guest = await createGuest();
        console.log(guest)
        setRealUser(guest);

        // 4️⃣ Navigate to login page
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Error during logout:", error);
      } finally {
        setLoggingOut(false);
      }
    };

    performLogout();
  }, [setUser, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <p className="text-lg">{loggingOut ? "Logging out..." : "Redirecting..."}</p>
    </div>
  );
}

