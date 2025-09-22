import { useEffect, useRef, useState, createContext } from "react";
import axios from "axios";
import { useGuestUser } from "../src/hooks/useGuestUser";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const guestCreatedRef = useRef(false);
  const didFetchRef = useRef(false);

  const { user: guestUser, setUser: updateGuest, loadingGuest } = useGuestUser();
  const [user, setUser] = useState(null);

  // 1️⃣ Fetch signed-in user
  useEffect(() => {
    console.log('fetching')
    console.log(user)
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/auth/profile");
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 2️⃣ Fallback to guest after signed-in check
  useEffect(() => {
    console.log(guestCreatedRef.current)
    if (loading || loadingGuest) return;
    if (user) return;
    if (!guestUser || guestCreatedRef.current) return;
    console.log('creating guest')

    guestCreatedRef.current = true;
    setUser(guestUser);
  }, [loading, loadingGuest, user, guestUser]);

  // 3️⃣ Generic updateUser works for both signed-in & guest
  const updateUser = (updates) => {
    console.log('update user')
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : prev;
      if (!prev?.id || prev?.isGuest) {
        updateGuest(updates);
      }
      return updated;
    });
  };

  // 4️⃣ Explicitly set a signed-in user
  const setRealUser = (realUser) => {
    console.log('set real user')
    setUser(realUser);
  };

  return (
    <UserContext.Provider
      value={{ user, setUser: updateUser, setRealUser, loading, updateUser }}
    >
      {children}
    </UserContext.Provider>
  );
}






