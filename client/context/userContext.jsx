import { useEffect, useRef, useState, createContext } from "react";
import axios from "axios";
import { useGuestUser } from "../src/hooks/useGuestUser";
import { useLocation } from "react-router-dom";

export const UserContext = createContext({
  user: null,
  setUser: () => {},
  setRealUser: () => {},
  loading: true,
  updateUser: () => {},
  fromInvite: false,
  inviteToken: null,
});

export function UserContextProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const guestCreatedRef = useRef(false);
  const location = useLocation();

  const [inviteToken, setInviteToken] = useState(() => {
    try {
      const initialSearch = (typeof window !== "undefined" && window.location?.search) || "";
      return new URLSearchParams(initialSearch).get("token");
    } catch {
      return null;
    }
  });

  const fromInvite = Boolean(inviteToken);

  const { user: guestUser, setUser: updateGuest, loadingGuest } = useGuestUser();
  const [user, setUser] = useState(null);

  useEffect(() => {
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

  useEffect(() => {
    if (loading || loadingGuest) return;
    if (user) return;
    if (!guestUser || guestCreatedRef.current) return;

    guestCreatedRef.current = true;
    setUser(guestUser);
  }, [loading, loadingGuest, user, guestUser]);

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : prev;
      if (!prev?.id || prev?.isGuest) {
        updateGuest(updates);
      }
      return updated;
    });
  };

  const setRealUser = (realUser) => {
    setUser(realUser);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: updateUser,
        setRealUser,
        loading,
        updateUser,
        fromInvite
      }}
    >
      {children}
    </UserContext.Provider>
  );
}








