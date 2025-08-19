// src/pages/Auth/Logout.jsx
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";

export default function Logout() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(null);

    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");

    navigate("/login", { replace: true });
  }, [setUser, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <p className="text-lg">Logging out...</p>
    </div>
  );
}
