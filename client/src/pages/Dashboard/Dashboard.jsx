import { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import BuyOrShortDisplay from "../../components/BuyOrShortStockDisplay";
import EliminationSequence from "../../components/EliminationSequence";
import LiveIdolNotification from "../../components/LiveIdolNotification";
import LiveEventNotification from "../../components/LiveEventNotification";
import IncomingTradeNotification from "../../components/IncomingTradeNotification";
import TradeOfferModal from "../../components/TradeOfferModal";
import LiveChallengeNotification from "../../components/LiveChallengeNotification";
import BootOrder from "../../components/BootOrder";
import ScoreEfficiencyBar from "../../components/ScoreEfficiencyBar";

const J = {
  bg:          "#0B1A2C",
  card:        "#0F2340",
  surface:     "#162B44",
  surfaceRing: "rgba(196,152,90,0.2)",
  green:       "#2D6A4F",
  greenBright: "#2D9E68",
  gold:        "#F2C94C",
  coral:       "#E8943A",
  text:        "#F5EDD0",
  textDim:     "rgba(245,237,208,0.5)",
  textFaint:   "rgba(245,237,208,0.22)",
  divider:     "rgba(196,152,90,0.18)",
};

export default function Dashboard() {
  const { user, updateUser, loading, from_invite } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const urlGroupId = searchParams.get("groupId");
  const [groupId, setGroupId] = useState(urlGroupId);
  const [budget, setBudget] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [prevNetWorth, setPrevNetWorth] = useState(null);
  const [maxPossibleBudget, setMaxPossibleBudget] = useState(null);
  const [maxPossibleLog, setMaxPossibleLog] = useState(null);
  const [bonuses, setBonuses] = useState([]);
  const [sharesOwned, setSharesOwned] = useState({});
  const [availableShares, setAvailableShares] = useState({});
  const [shortsOwned, setShortsOwned] = useState({});
  const [availableShorts, setAvailableShorts] = useState({});
  const [maxSharesPerPlayer, setMaxSharesPerPlayer] = useState(50);
  const [survivorPlayerStats, setSurvivorPlayerStats] = useState({});
  const [prices, setPrices] = useState({});
  const [currentPrices, setCurrentPrices] = useState({});
  const [leaderboard, setLeaderboard] = useState({});
  const [loadingFinancials, setLoadingFinancials] = useState(true);
  const [financialData, setFincancialData] = useState({});
  const [season, setSeason] = useState([]);
  const [week, setWeek] = useState(null);
  const [medianPrice, setMedianPrice] = useState([]);
  const [lastSeenWeek, setLastSeenWeek] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [eliminatedSurvivors, setEliminatedSurvivors] = useState([]);
  const [displayOrder, setDisplayOrder] = useState([]);
  const [appliedSort, setAppliedSort] = useState("name");
  const [isSortStale, setIsSortStale] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [scrollY, setScrollY] = useState(0);
  const compactView = true;
  const [onAir, setOnAir] = useState(false);
  const [tribalCouncil, setTribalCouncil] = useState(false);
  const [liveBonusBalance, setLiveBonusBalance] = useState(null);
  const [seenLiveEventCount, setSeenLiveEventCount] = useState(0);
  const [pendingIdolNotifications, setPendingIdolNotifications] = useState([]);
  const [seenLiveEventBonusCount, setSeenLiveEventBonusCount] = useState(0);
  const [pendingEventNotifications, setPendingEventNotifications] = useState([]);
  const [seenChallengeEventCount, setSeenChallengeEventCount] = useState(0);
  const [pendingChallengeNotifications, setPendingChallengeNotifications] = useState([]);
  const [pendingTradeNotifications, setPendingTradeNotifications] = useState([]);
  const [incomingTrades, setIncomingTrades] = useState([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const prevOnAirRef = useRef(null);
  const groupDropdownRef = useRef(null);
  const seenTradeIdsRef = useRef(new Set());

  // Heights must match the actual rendered sizes
  const NAVBAR_H = 56; // Navbar h-14
  const HUD_H    = 40; // HUD bar fixed height

  useEffect(() => {
    if (loading || !user) return;
    let isMounted = true;

    async function getData() {
      try {
        const publicRequests = [
          axios.get("/transactions/getprices"),
          axios.get("/admin/getcurrentseason"),
          axios.get("/episode/getcurrentepisode"),
          axios.get("/transactions/getprofile"),
        ];

        const privateRequests =
          user.isGuest || !user.id
            ? []
            : [
                axios.get("/transactions/getportfolio", { params: { userId: user.id, groupId } }),
                axios.get(`/leaderboard/getleaderboard/${user.id}`),
                axios.get("/groups/user-groups", { params: { userId: user.id } }),
              ];

        const results = await Promise.all([...publicRequests, ...privateRequests]);

        const pricesData        = results[0].data;
        const seasonData        = results[1].data;
        const episodeData       = results[2].data;
        const survivorPlayersData = results[3].data || [];

        let financialData  = null;
        let leaderboardRank = null;
        let groupsData     = [];
        if (privateRequests.length > 0) {
          financialData   = results[4].data;
          leaderboardRank = results[5].data;
          groupsData      = results[6].data || [];
        }

        const survivorsMap = (survivorPlayersData || []).reduce((acc, player) => {
          acc[player.name] = player;
          return acc;
        }, {});

        if (!isMounted) return;

        setPrices(pricesData);
        setWeek(seasonData.currentWeek);
        setSeason(seasonData.seasonName);
        setMedianPrice(seasonData.currentPrice);
        setSurvivorPlayerStats(survivorsMap);
        setEliminatedSurvivors(episodeData.lastEpisodeVotedOut || []);
        setOnAir(episodeData.onAir ?? false);
        setTribalCouncil(episodeData.tribalCouncil ?? false);
        // Initialise seen counts so we don't replay old events on load
        setSeenLiveEventCount((episodeData.liveIdolEvents || []).length);
        setSeenLiveEventBonusCount((episodeData.liveEventBonuses || []).length);
        setSeenChallengeEventCount((episodeData.liveChallengeEvents || []).length);

        if (!user.isGuest && financialData) {
          if (financialData.groupId) setGroupId(String(financialData.groupId));
          setBudget(financialData.user.budget);
          setNetWorth(financialData.user.netWorth);
          setLiveBonusBalance(financialData.user.liveBonusBalance ?? null);
          setFincancialData(financialData)
          const fullPortfolio = {};
          survivorPlayersData.forEach(s => { fullPortfolio[s.name] = 0; });
          Object.assign(fullPortfolio, financialData.user.portfolio);
          setSharesOwned(fullPortfolio);
          if (financialData.availableShares) setAvailableShares(financialData.availableShares);
          if (financialData.availableShorts) setAvailableShorts(financialData.availableShorts);
          if (financialData.currentPrices) setCurrentPrices(financialData.currentPrices);
          const fullShorts = {};
          survivorPlayersData.forEach(s => { fullShorts[s.name] = 0; });
          Object.assign(fullShorts, financialData.user.shorts);
          setShortsOwned(fullShorts);
          setMaxPossibleBudget(financialData.maxPossibleBudget ?? null);
          setMaxPossibleLog(financialData.maxPossibleLog ?? null);
          if (financialData.maxSharesPerPlayer) setMaxSharesPerPlayer(financialData.maxSharesPerPlayer);
          setBonuses(financialData.user.bonuses || []);
          setUserGroups(groupsData);
          setLeaderboard(leaderboardRank);
          setLastSeenWeek(financialData.user.last_seen_episode_id);
          setPrevNetWorth(financialData.prevNetWorth);
        } else {
          setBudget(user.budget);
          setNetWorth(user.netWorth);
          setSharesOwned(user.portfolio || {});
          setLeaderboard([]);
          setLastSeenWeek(null);
          setPrevNetWorth(null);
        }
      } catch (error) {
        console.error("getData error:", error);
      } finally {
        if (isMounted) setLoadingFinancials(false);
      }
    }

    getData();
    return () => { isMounted = false; };
  }, [loading, user, refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target)) {
        // no-op: dropdown replaced by inline list
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track scroll so the HUD slides up in sync with the navbar
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const switchGroup = async (newGroupId) => {
    if (newGroupId === groupId) return;
    try {
      const { data } = await axios.get("/transactions/getportfolio", {
        params: { userId: user.id, groupId: newGroupId },
      });
      setGroupId(String(data.groupId));
      setBudget(data.user.budget);
      setNetWorth(data.user.netWorth);
      setPrevNetWorth(data.prevNetWorth);
      const fullPortfolio = {};
      Object.keys(survivorPlayerStats).forEach(name => { fullPortfolio[name] = 0; });
      Object.assign(fullPortfolio, data.user.portfolio);
      setSharesOwned(fullPortfolio);
      if (data.availableShares) setAvailableShares(data.availableShares);
      if (data.availableShorts) setAvailableShorts(data.availableShorts);
      if (data.currentPrices) setCurrentPrices(data.currentPrices);
      const fullShorts = {};
      Object.keys(survivorPlayerStats).forEach(name => { fullShorts[name] = 0; });
      Object.assign(fullShorts, data.user.shorts);
      setShortsOwned(fullShorts);
      if (data.maxSharesPerPlayer) setMaxSharesPerPlayer(data.maxSharesPerPlayer);
      setMaxPossibleBudget(data.maxPossibleBudget ?? null);
      setMaxPossibleLog(data.maxPossibleLog ?? null);
    } catch (error) {
      toast.error("Failed to switch group");
    }
  };

  useEffect(() => {
    const updateLastSeen = async () => {
      if (loading || week == null || lastSeenWeek == null) return;
      if (lastSeenWeek !== week) {
        setShowAnimation(true);
        try {
          await axios.put(`/episode/updatelastseenepisode/${user.id}`);
        } catch (error) {
          console.error("Failed to update last seen episode:", error);
        }
      }
    };
    updateLastSeen();
  }, [loading, week, lastSeenWeek, user]);

  // Poll for incoming trade offers
  useEffect(() => {
    if (user?.isGuest || !user?.id || !groupId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get('/trades/pending', { params: { userId: user.id, groupId } });
        // Always keep the list view in sync with server state
        setIncomingTrades(data);
        // Only show full-screen notification for trades we haven't shown before
        const newUnseen = data.filter((t) => !seenTradeIdsRef.current.has(t._id));
        if (newUnseen.length > 0) {
          newUnseen.forEach((t) => seenTradeIdsRef.current.add(t._id));
          setPendingTradeNotifications((prev) => [...prev, ...newUnseen]);
        }
      } catch { /* silent */ }
    }, 6000);
    return () => clearInterval(interval);
  }, [user, groupId]);

  // Fetch group members whenever groupId changes (needed for trade button + modal)
  useEffect(() => {
    if (!groupId || !user?.id || user?.isGuest) return;
    axios.get('/trades/group-members', { params: { groupId, userId: user.id } })
      .then(({ data }) => setGroupMembers(data))
      .catch(() => { /* silent */ });
  }, [groupId, user]);

  // Poll for on-air status changes and live idol events
  useEffect(() => {
    if (user?.isGuest) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get('/episode/getcurrentepisode');
        const isOnAir = data.onAir ?? false;

        // Detect any on-air state transition: trigger a full data refresh
        if (prevOnAirRef.current !== null && prevOnAirRef.current !== isOnAir) {
          setRefreshTrigger((t) => t + 1);
        }
        prevOnAirRef.current = isOnAir;
        setOnAir(isOnAir);
        setTribalCouncil(data.tribalCouncil ?? false);

        // Check for new idol events and event bonuses while on air
        if (isOnAir) {
          const idolEvents = data.liveIdolEvents || [];
          if (idolEvents.length > seenLiveEventCount) {
            const newEvents = idolEvents.slice(seenLiveEventCount);
            setPendingIdolNotifications((prev) => [...prev, ...newEvents]);
            setSeenLiveEventCount(idolEvents.length);
          }

          const eventBonuses = data.liveEventBonuses || [];
          if (eventBonuses.length > seenLiveEventBonusCount) {
            const newBonuses = eventBonuses.slice(seenLiveEventBonusCount);
            // Challenge entries (wonChallenge / lostChallenge) are handled by
            // LiveChallengeNotification — exclude them here to avoid one popup per player
            const nonChallenge = newBonuses.filter(
              b => b.field !== 'wonChallenge' && b.field !== 'lostChallenge'
            );
            if (nonChallenge.length > 0) {
              setPendingEventNotifications((prev) => [...prev, ...nonChallenge]);
            }
            setSeenLiveEventBonusCount(eventBonuses.length);
          }

          const challengeEvents = data.liveChallengeEvents || [];
          if (challengeEvents.length > seenChallengeEventCount) {
            const newEvents = challengeEvents.slice(seenChallengeEventCount);
            setPendingChallengeNotifications((prev) => [...prev, ...newEvents]);
            setSeenChallengeEventCount(challengeEvents.length);
          }
        }
      } catch { /* silent */ }
    }, 6000);
    return () => clearInterval(interval);
  }, [user, seenLiveEventCount, seenLiveEventBonusCount, seenChallengeEventCount]);

  const dismissIdolNotification = async () => {
    setPendingIdolNotifications((prev) => prev.slice(1));
    // Refresh budget after bonus was applied
    if (!user?.isGuest && groupId) {
      try {
        const { data } = await axios.get("/transactions/getportfolio", {
          params: { userId: user.id, groupId },
        });
        setBudget(data.user.budget);
        setNetWorth(data.user.netWorth);
        setLiveBonusBalance(data.user.liveBonusBalance ?? null);
      } catch { /* silent */ }
    }
  };

  const dismissEventNotification = async () => {
    setPendingEventNotifications((prev) => prev.slice(1));
    if (!user?.isGuest && groupId) {
      try {
        const { data } = await axios.get("/transactions/getportfolio", {
          params: { userId: user.id, groupId },
        });
        setBudget(data.user.budget);
        setNetWorth(data.user.netWorth);
        setLiveBonusBalance(data.user.liveBonusBalance ?? null);
      } catch { /* silent */ }
    }
  };

  const dismissChallengeNotification = () => setPendingChallengeNotifications((prev) => prev.slice(1));

  const refreshPortfolioAfterTrade = async () => {
    if (!user?.isGuest && groupId) {
      try {
        const { data } = await axios.get("/transactions/getportfolio", {
          params: { userId: user.id, groupId },
        });
        setBudget(data.user.budget);
        setNetWorth(data.user.netWorth);
        const fullPortfolio = {};
        Object.keys(survivorPlayerStats).forEach(name => { fullPortfolio[name] = 0; });
        Object.assign(fullPortfolio, data.user.portfolio);
        setSharesOwned(fullPortfolio);
        if (data.availableShares) setAvailableShares(data.availableShares);
        if (data.currentPrices) setCurrentPrices(data.currentPrices);
      } catch { /* silent */ }
    }
  };

  // Full-screen popup dismiss handlers
  const dismissTradeAccept = async (tradeId) => {
    setPendingTradeNotifications((prev) => prev.slice(1));
    setIncomingTrades((prev) => prev.filter((t) => t._id !== tradeId));
    await refreshPortfolioAfterTrade();
  };
  const dismissTradeDecline = (tradeId) => {
    setPendingTradeNotifications((prev) => prev.slice(1));
    setIncomingTrades((prev) => prev.filter((t) => t._id !== tradeId));
  };
  // "Later" — only hides the popup, trade stays in the list inside the modal
  const dismissTradeClose = () => setPendingTradeNotifications((prev) => prev.slice(1));

  // List-view handlers (inside TradeOfferModal)
  const handleAcceptIncoming = async (tradeId) => {
    setIncomingTrades((prev) => prev.filter((t) => t._id !== tradeId));
    await refreshPortfolioAfterTrade();
  };
  const handleDeclineIncoming = (tradeId) => {
    setIncomingTrades((prev) => prev.filter((t) => t._id !== tradeId));
  };

  const stockOrder = (mode) => {
    const keys = Object.keys(sharesOwned);
    const active = [];
    const eliminated = [];

    keys.forEach((k) => {
      const survivor = survivorPlayerStats[k];
      const shares   = sharesOwned[k] ?? 0;
      const priceNow = week === 0 ? (medianPrice ?? 0) : (prices[k] ?? 0);
      const value    = shares * priceNow;
      const name     = survivor.name;

      if (survivor?.availability) {
        active.push({ k, shares, value, name });
      } else {
        eliminated.push({ k, shares, value, name });
      }
    });

    if (mode === "name") {
      active.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      active.sort((a, b) => {
        if (b.shares !== a.shares) return b.shares - a.shares;
        return a.k.localeCompare(b.k);
      });
    }

    eliminated.sort((a, b) => a.k.localeCompare(b.k));
    return [...active.map(x => x.k), ...eliminated.map(x => x.k)];
  };

  useEffect(() => {
    const keys = Object.keys(sharesOwned);
    setDisplayOrder((prev) => {
      if (!prev || prev.length === 0) return stockOrder("name");
      const setKeys = new Set(keys);
      const still   = prev.filter((k) => setKeys.has(k));
      const setPrev = new Set(still);
      const added   = keys.filter((k) => !setPrev.has(k));
      return [...still, ...added];
    });
  }, [sharesOwned]);

  useEffect(() => {
    if (!displayOrder.length) return;
    const ideal = stockOrder(appliedSort);
    const same  = ideal.length === displayOrder.length && ideal.every((k, i) => k === displayOrder[i]);
    setIsSortStale(!same);
  }, [sharesOwned, prices, week, medianPrice, appliedSort, displayOrder, survivorPlayerStats]);

  // ── Loading ──
  if (loading || loadingFinancials)
    return (
      <div style={{ minHeight: "100vh", background: J.bg, display: "grid", placeItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            className="animate-spin"
            style={{
              width: 48, height: 48, borderRadius: "50%",
              border: `3px solid ${J.divider}`,
              borderTopColor: J.greenBright,
            }}
          />
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase", color: J.greenBright }}>
            Loading…
          </p>
        </div>
      </div>
    );

  const updatePortfolio = async (survivorPlayer, amount, action) => {
    if (!user) return;

    const handleGuestUpdate = (survivorPlayer, amount, action) => {
      let price = week === 0 ? 5 : (prices[survivorPlayer] || 0);
      const buySellAmount  = action === "buy" ? amount : -amount;
      const currentShares  = sharesOwned[survivorPlayer] || 0;
      let newShares;

      if (action === "buy") {
        if (budget >= amount * price) { newShares = currentShares + amount; }
        else { toast.error("Not enough funds"); return; }
      } else if (action === "sell") {
        if (currentShares >= amount) { newShares = currentShares - amount; }
        else { toast.error("No stock to sell."); return; }
      }

      setSharesOwned((prev) => ({ ...prev, [survivorPlayer]: newShares }));
      if (action === "buy")  setBudget((prev) => prev - amount * price);
      if (action === "sell") setBudget((prev) => prev + amount * price);

      const updatedPortfolio = { ...sharesOwned, [survivorPlayer]: newShares };
      const updatedNetWorth  = netWorth + buySellAmount * price;
      const updatedBudget    = budget - buySellAmount * price;

      setSharesOwned(updatedPortfolio);
      setNetWorth(updatedNetWorth);
      setBudget(updatedBudget);
      updateUser({ portfolio: updatedPortfolio, budget: updatedBudget, netWorth: updatedNetWorth });
      sessionStorage.setItem("guest_portfolio", JSON.stringify(updatedPortfolio));
      sessionStorage.setItem("guest_netWorth", updatedNetWorth);
      sessionStorage.setItem("guest_budget", updatedBudget);
    };

    if (user.isGuest) {
      handleGuestUpdate(survivorPlayer, amount, action);
    } else {
      try {
        const { data } = await axios.put("/transactions/updateportfoliopreseason", {
          userId: user.id, groupId, survivorPlayer, amount, action,
        });
        if (data.error) {
          toast.error(data.error);
        } else {
          resetPrices();
          setBudget(data.budget);
          setNetWorth(data.netWorth);
          if (data.lockedBudget != null) {
            setLiveBonusBalance(Math.max(0, data.budget - data.lockedBudget));
          }
          if (action === "short" || action === "cover") {
            setShortsOwned(prev => ({ ...prev, ...data.shorts }));
            setAvailableShorts(prev => ({
              ...prev,
              [survivorPlayer]: (prev[survivorPlayer] ?? maxSharesPerPlayer) + (action === "short" ? -amount : amount),
            }));
          } else {
            setSharesOwned(prev => ({ ...prev, ...data.portfolio }));
            const newAvailable = (availableShares[survivorPlayer] ?? maxSharesPerPlayer) + (action === "buy" ? -amount : amount);
            setAvailableShares(prev => ({ ...prev, [survivorPlayer]: newAvailable }));
            const newUsed = maxSharesPerPlayer - newAvailable;
            setCurrentPrices(prev => ({ ...prev, [survivorPlayer]: calculateTierPrice(newUsed, maxSharesPerPlayer) }));
          }
        }
      } catch (error) {
        toast.error("Something went wrong updating your portfolio.");
      }
    }
  };

  const calculateTierPrice = (sharesUsed, groupMax) => {
    const pct = sharesUsed / groupMax;
    if (pct < 0.2) return 1;
    if (pct < 0.4) return 2;
    if (pct < 0.6) return 3;
    if (pct < 0.8) return 4;
    return 5;
  };

  const buyStock   = (s, a) => updatePortfolio(s, a, "buy");
  const sellStock  = (s, a) => updatePortfolio(s, a, "sell");
  const shortStock = (s, a) => updatePortfolio(s, a, "short");
  const coverShort = (s, a) => updatePortfolio(s, a, "cover");

  const resetPrices = async () => {
    try { const { data } = await axios.get("/transactions/getprices"); setPrices(data); }
    catch (error) { console.log(error); }
  };

  const formattedBudget   = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(budget);
  const formattedNetWorth = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(netWorth);

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  const rankValue  = leaderboard && typeof leaderboard === "object" ? leaderboard.rank : leaderboard;
  const weekLabel  = Number(week) === 0 ? "Preseason" : `Week ${week}`;

  // Sidebar card base style
  const sideCard = {
    borderRadius: 14,
    background: J.surface,
    border: `1px solid ${J.surfaceRing}`,
    padding: "16px",
  };

  return (
    <>
      {pendingIdolNotifications.length > 0 && (() => {
        const evt = pendingIdolNotifications[0];
        const survivorName = evt.survivorName;
        return (
          <LiveIdolNotification
            survivorName={survivorName}
            bonusPerShare={evt.bonusPerShare ?? 0.50}
            sharesOwned={sharesOwned[survivorName] ?? 0}
            survivorProfilePic={survivorPlayerStats[survivorName]?.profile_pic ?? null}
            onClose={dismissIdolNotification}
          />
        );
      })()}

      {pendingIdolNotifications.length === 0 && pendingEventNotifications.length > 0 && (() => {
        const evt = pendingEventNotifications[0];
        return (
          <LiveEventNotification
            field={evt.field}
            survivorName={evt.survivorName}
            survivorProfilePic={survivorPlayerStats[evt.survivorName]?.profile_pic ?? null}
            sharesOwned={sharesOwned[evt.survivorName] ?? 0}
            shortsOwned={shortsOwned[evt.survivorName] ?? 0}
            onClose={dismissEventNotification}
          />
        );
      })()}

      {pendingIdolNotifications.length === 0 && pendingEventNotifications.length === 0 && pendingTradeNotifications.length > 0 && (
        <IncomingTradeNotification
          trade={pendingTradeNotifications[0]}
          userId={user.id}
          groupId={groupId}
          onAccept={(tradeId) => dismissTradeAccept(tradeId)}
          onDecline={(tradeId) => dismissTradeDecline(tradeId)}
          onClose={dismissTradeClose}
        />
      )}

      {showTradeModal && (
        <TradeOfferModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          groupId={groupId}
          userId={user.id}
          groupMembers={groupMembers}
          myPortfolio={sharesOwned}
          myBudget={budget}
          survivorNames={Object.keys(survivorPlayerStats)}
          onTradeSent={() => setShowTradeModal(false)}
          incomingTrades={incomingTrades}
          onAcceptIncoming={handleAcceptIncoming}
          onDeclineIncoming={handleDeclineIncoming}
        />
      )}

      {pendingIdolNotifications.length === 0 && pendingEventNotifications.length === 0 && pendingTradeNotifications.length === 0 && pendingChallengeNotifications.length > 0 && (
        <LiveChallengeNotification
          challengeEvent={pendingChallengeNotifications[0]}
          sharesOwned={sharesOwned}
          shortsOwned={shortsOwned}
          onClose={dismissChallengeNotification}
        />
      )}

      {showAnimation && Number(week) > 0 && (
        <EliminationSequence
          week={week}
          eliminatedSurvivors={eliminatedSurvivors}
          survivorPlayerStats={survivorPlayerStats}
          sharesOwned={sharesOwned}
          prices={prices}
          medianPrice={medianPrice}
          prevNetWorth={prevNetWorth}
          netWorth={netWorth}
          bonuses={bonuses}
          onFinish={() => setShowAnimation(false)}
        />
      )}

      <div style={{ minHeight: "100vh", background: J.bg, color: J.text, paddingTop: NAVBAR_H + HUD_H }}>

        {/* ── Live HUD — fixed, slides up in sync with the navbar ── */}
        <div
          style={{
            position: "fixed",
            top: Math.max(NAVBAR_H - scrollY, 0),
            left: 0, right: 0,
            height: HUD_H,
            zIndex: 35,
            background: "rgba(9,20,38,0.97)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: `1px solid ${J.divider}`,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="mx-auto max-w-[1400px]" style={{ width: "100%", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: "0.18em", textTransform: "uppercase", color: J.textFaint }}>
                {season && `${season} · `}{weekLabel}
              </span>
              {onAir && (
                <span style={{
                  fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: "0.16em",
                  textTransform: "uppercase", fontWeight: 700,
                  color: "#ff4444", display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%", background: "#ff4444",
                    boxShadow: "0 0 6px #ff4444",
                    animation: "livePulse 1.4s ease-in-out infinite",
                    display: "inline-block",
                  }} />
                  Live
                </span>
              )}
            </div>

            {Number(week) > 0 ? (
              <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
                {[
                  { label: "Rank",      value: rankValue != null ? ordinal(rankValue) : "—", color: J.text },
                  { label: "Net Worth", value: formattedNetWorth,                             color: J.greenBright },
                  { label: onAir ? "Bonus" : "Budget", value: onAir && liveBonusBalance !== null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(liveBonusBalance) : formattedBudget, color: J.gold },
                ].map(({ label, value, color }, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 28 }}>
                    {i > 0 && <div style={{ width: 1, height: 24, background: J.divider }} />}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em" }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Cinzel', serif", color }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em" }}>{onAir ? "Bonus" : "Budget"}</div>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Cinzel', serif", color: J.gold }}>
                  {onAir && liveBonusBalance !== null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(liveBonusBalance) : formattedBudget}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Hero welcome section ── */}
        <div style={{ borderBottom: `1px solid ${J.divider}`, marginBottom: 0 }}>
          <div className="mx-auto max-w-[1400px]" style={{ padding: "16px 28px 12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              <h1
                className="font-heading"
                style={{ fontSize: "clamp(20px, 2.5vw, 28px)", lineHeight: 1.2, color: J.text, margin: 0 }}
              >
                {user?.isGuest
                  ? "Try the Game"
                  : <><span style={{ color: J.gold }}>{user?.name}</span>{" "}is in the game.</>}
              </h1>
              {/* Inline stats */}
              {Number(week) > 0 && !user?.isGuest && (
                <span style={{ fontSize: 13, color: J.textDim }}>
                  <span style={{ color: J.greenBright, fontWeight: 600 }}>{formattedNetWorth}</span>
                  {" "}·{" "}
                  <span style={{ color: J.gold, fontWeight: 600 }}>
                    {onAir && liveBonusBalance !== null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(liveBonusBalance) : formattedBudget}
                  </span>
                  {" "}{onAir ? "bonus" : "to spend"}
                </span>
              )}
              {Number(week) < 1 && (
                <span style={{ fontSize: 13, color: J.textDim }}>
                  <span style={{ color: J.gold, fontWeight: 600 }}>{formattedBudget}</span>
                  {" "}to spend
                </span>
              )}
            </div>

            {/* Efficiency bar */}
            {!user?.isGuest && Number(week) > 0 && maxPossibleBudget != null && (
              <div style={{ maxWidth: 520 }}>
                <ScoreEfficiencyBar netWorth={netWorth} maxPossibleBudget={maxPossibleBudget} maxPossibleLog={maxPossibleLog} />
              </div>
            )}

            {/* Controls toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${J.divider}` }}>

              {/* Group switcher */}
              {!user?.isGuest && userGroups.length > 1 && (
                <>
                  <span style={{ fontSize: 10, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em", flexShrink: 0 }}>Group:</span>
                  {userGroups.map(g => {
                    const isActive = String(g._id) === String(groupId);
                    return (
                      <button key={g._id} type="button" onClick={() => switchGroup(String(g._id))} style={{
                        padding: "4px 11px", borderRadius: 8,
                        border: `1px solid ${isActive ? "rgba(58,140,82,0.4)" : J.surfaceRing}`,
                        background: isActive ? "rgba(58,140,82,0.15)" : "transparent",
                        color: isActive ? J.greenBright : J.textDim,
                        fontSize: 12, fontWeight: isActive ? 600 : 400,
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                        {g.displayName}
                      </button>
                    );
                  })}
                  <div style={{ width: 1, height: 16, background: J.divider, margin: "0 2px", flexShrink: 0 }} />
                </>
              )}

              {/* Sort */}
              <span style={{ fontSize: 10, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em", flexShrink: 0 }}>Sort:</span>
              {[{ mode: "name", label: "A → Z" }, { mode: "stock", label: "Most Owned" }].map(({ mode, label }) => {
                const active = mode === "stock" ? appliedSort === "stock" && !isSortStale : appliedSort === "name";
                return (
                  <button key={mode} type="button"
                    onClick={() => { setDisplayOrder(stockOrder(mode)); setAppliedSort(mode); setIsSortStale(mode === "name"); }}
                    style={{
                      padding: "4px 11px", borderRadius: 8, fontSize: 12, fontWeight: active ? 600 : 400,
                      border: `1px solid ${active ? "rgba(212,168,67,0.45)" : J.surfaceRing}`,
                      background: active ? "rgba(212,168,67,0.1)" : "transparent",
                      color: active ? J.gold : J.textDim, cursor: "pointer", transition: "all 0.15s",
                    }}>
                    {label}
                  </button>
                );
              })}

              {/* Trade */}
              {!user?.isGuest && groupMembers.length > 0 && (
                <>
                  <div style={{ width: 1, height: 16, background: J.divider, margin: "0 2px", flexShrink: 0 }} />
                  <button type="button" onClick={() => setShowTradeModal(true)} style={{
                    padding: "4px 11px", borderRadius: 8,
                    background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)",
                    color: J.gold, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                  }}>
                    🤝 Trades
                    {incomingTrades.length > 0 && (
                      <span style={{
                        background: J.coral, color: "#fff", borderRadius: "50%",
                        fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                      }}>{incomingTrades.length}</span>
                    )}
                  </button>
                </>
              )}

              {/* Guest links */}
              {(!user || user.isGuest) && (
                <>
                  <div style={{ width: 1, height: 16, background: J.divider, margin: "0 2px", flexShrink: 0 }} />
                  <Link to="/register" style={{
                    padding: "4px 14px", borderRadius: 8, background: J.green, color: J.text,
                    fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: "'Cinzel', serif",
                  }}>Sign Up</Link>
                  <Link to="/login" style={{
                    padding: "4px 14px", borderRadius: 8, background: "transparent",
                    border: `1px solid ${J.surfaceRing}`, color: J.textDim,
                    fontWeight: 600, fontSize: 12, textDecoration: "none",
                  }}>Log In</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Episode Live banner ── */}
        {onAir && !tribalCouncil && (
          <div style={{
            background: "rgba(180,30,30,0.12)",
            borderTop: "1px solid rgba(255,68,68,0.25)",
            borderBottom: "1px solid rgba(255,68,68,0.25)",
          }}>
            <div className="mx-auto max-w-[1400px]" style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 8px #ff4444", display: "inline-block", flexShrink: 0, animation: "livePulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, fontFamily: "'Cinzel', serif", letterSpacing: "0.16em", textTransform: "uppercase", color: "#ff8888", fontWeight: 700 }}>
                Episode Live
              </span>
              <span style={{ fontSize: 12, color: "rgba(226,240,232,0.45)", marginLeft: 6 }}>
                · Your positions are locked. Idol bonus money can still be invested.
              </span>
            </div>
          </div>
        )}

        {/* ── Tribal Council banner ── */}
        {tribalCouncil && (
          <div style={{
            background: "rgba(180,80,0,0.15)",
            borderTop: "1px solid rgba(255,140,0,0.3)",
            borderBottom: "1px solid rgba(255,140,0,0.3)",
          }}>
            <div className="mx-auto max-w-[1400px]" style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 12, fontFamily: "'Cinzel', serif", letterSpacing: "0.16em", textTransform: "uppercase", color: "#ffaa44", fontWeight: 700 }}>
                Tribal Council
              </span>
              <span style={{ fontSize: 12, color: "rgba(226,240,232,0.45)", marginLeft: 6 }}>
                · All trading is locked until tribal council ends.
              </span>
            </div>
          </div>
        )}

        {/* ── Two-column: boot order | player grid ── */}
        <div
          className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[440px_1fr]"
          style={{ padding: "24px 28px 60px", gap: 24, alignItems: "start" }}
        >

          {/* ── Boot Order column ── */}
          <div
            className="lg:sticky"
            style={{ top: 112, maxHeight: "calc(100vh - 130px)", overflowY: "auto" }}
          >
            <BootOrder 
              groupId={groupId}
              bootOrders={financialData?.user?.bootOrders ?? {}}
            />
          </div>

          {/* ── Player grid ── */}
          <main>
            <div
              className={compactView ? "grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-1 xl:grid-cols-2"}
              style={{ gap: compactView ? 12 : 20 }}
            >
              {displayOrder.map((survivorPlayer) => {
                const survivor = survivorPlayerStats[survivorPlayer];
                if (!survivor) return null;

                return (
                  <div key={survivorPlayer}>
                    <BuyOrShortDisplay
                      name={survivorPlayer}
                      profilePhotoUrl={survivor.profile_pic}
                      shares={sharesOwned[survivorPlayer] ?? 0}
                      availableShares={availableShares[survivorPlayer] ?? maxSharesPerPlayer}
                      maxSharesPerPlayer={maxSharesPerPlayer}
                      shorts={shortsOwned[survivorPlayer] ?? 0}
                      availableShorts={availableShorts[survivorPlayer] ?? maxSharesPerPlayer}
                      currentPrice={currentPrices[survivorPlayer] ?? 1}
                      isOnAir={onAir}
                      tribalCouncil={tribalCouncil}
                      liveBonusBalance={liveBonusBalance}
                      buyStock={buyStock}
                      sellStock={sellStock}
                      shortStock={shortStock}
                      coverShort={coverShort}
                    />
                  </div>
                );
              })}
            </div>
          </main>

        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}
