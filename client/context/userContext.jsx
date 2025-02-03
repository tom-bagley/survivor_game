import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/auth/profile");
        setUser(data); // Set the user data
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null); // Set user to null if the request fails
      } finally {
        setLoading(false); // Set loading to false after the request completes
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}
