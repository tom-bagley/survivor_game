import { useState, useEffect } from "react";
import { createGuest } from "../utils/guest";

export function useGuestUser(from_invite) {
  const [user, setUser] = useState(null);
  const [loadingGuest, setLoadingGuest] = useState(true);

  useEffect(() => {
    const loadGuest = async () => {
      // Try to load guest from sessionStorage
      const savedGuest = sessionStorage.getItem("guest_user");
      if (savedGuest && savedGuest !== "{}") {
        setUser(JSON.parse(savedGuest));
        setLoadingGuest(false);
        return;
      }

      // No guest saved — create new one
      const guest = await createGuest(from_invite);
      sessionStorage.setItem("guest_user", JSON.stringify(guest));
      setUser(guest);
      setLoadingGuest(false);
    };

    loadGuest();
  }, []);

  // Helper to update guest in state and sessionStorage
  const updateGuest = (updates) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : prev;
      sessionStorage.setItem("guest_user", JSON.stringify(updated));
      return updated;
    });
  };

  return { user, setUser: updateGuest, loadingGuest };
}



