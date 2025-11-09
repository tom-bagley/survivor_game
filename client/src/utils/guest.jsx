import axios from "axios";

// src/utils/guest.js
const DEFAULT_BUDGET = 500;
const GUEST_KEY = "survivor_guest";

function uid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) {}
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export async function createGuest(from_invite, overrides = {}) {
  console.log(from_invite);
  let survivors = [];

  try {
    const { data } = await axios.get("/players/allplayers");
    survivors = data || [];
  } catch (error) {
    console.error("Failed to fetch all players for guest:", error);
  }

  const portfolio = {};
  survivors.forEach((s) => (portfolio[s.name] = 0));

  const guest = {
    id: `guest:${uid()}`,
    name: overrides.name ?? `Guest ${Math.floor(Math.random() * 9000) + 1000}`,
    isGuest: true,
    createdAt: new Date().toISOString(),
    budget: overrides.budget ?? DEFAULT_BUDGET,
    netWorth: overrides.netWorth ?? DEFAULT_BUDGET,
    portfolio: overrides.portfolio ?? portfolio,
    last_seen_episode_id: overrides.last_seen_episode_id ?? null,
    prevNetWorth: overrides.prevNetWorth ?? null,
    role: "user",
    email: "",

  };
  return guest;
}

export function clearGuest() {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch (e) {
    console.error("clearGuest error", e);
  }
}
