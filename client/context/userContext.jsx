import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/auth/profile");
        console.log(data)
        setUser(data); 
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null); 
      } finally {
        setLoading(false); 
      }
    };

    fetchUser();
  }, []);

  const updateUser = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}
