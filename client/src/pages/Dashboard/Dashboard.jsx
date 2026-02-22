import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { J } from "./colors";
import DashboardHUD from "./DashboardHUD";
import DashboardHero from "./DashboardHero";
import LiveBanners from "./LiveBanners";
import PlayerGrid from "./PlayerGrid";
import EliminationSequence from "../../components/EliminationSequence";
import LiveIdolNotification from "../../components/LiveIdolNotification";
import LiveEventNotification from "../../components/LiveEventNotification";
import IncomingTradeNotification from "../../components/IncomingTradeNotification";
import TradeOfferModal from "../../components/TradeOfferModal";
import LiveChallengeNotification from "../../components/LiveChallengeNotification";
import BootOrder from "../../components/BootOrder";

const NAVBAR_H = 56;
const HUD_H    = 40;

export default function Dashboard() {
  const { user, updateUser, loading } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const urlGroupId = searchParams.get("groupId");
  const [groupId, setGroupId] = useState(urlGroupId);
  const [financialData, setFinancialData] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [episodeData, setEpisodeData] = useState(null);
  const [survivorPlayerStats, setSurvivorPlayerStats] = useState({});
  const [prices, setPrices] = useState({});
  const [leaderboard, setLeaderboard] = useState({});
  const [loadingFinancials, setLoadingFinancials] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [displayOrder, setDisplayOrder] = useState([]);
  const [appliedSort, setAppliedSort] = useState("name");
  const [isSortStale, setIsSortStale] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [scrollY, setScrollY] = useState(0);
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
  const seenTradeIdsRef = useRef(new Set());

  // Zero-fill all survivors so every card renders even with 0 shares
  const sharesOwned = useMemo(() => {
    const full = {};
    Object.keys(survivorPlayerStats).forEach(name => { full[name] = 0; });
    if (financialData?.user?.portfolio) Object.assign(full, financialData.user.portfolio);
    return full;
  }, [financialData, survivorPlayerStats]);

  const shortsOwned = useMemo(() => {
    const full = {};
    Object.keys(survivorPlayerStats).forEach(name => { full[name] = 0; });
    if (financialData?.user?.shorts) Object.assign(full, financialData.user.shorts);
    return full;
  }, [financialData, survivorPlayerStats]);

  // ── Data fetching ──
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

        const pricesResult   = results[0].data;
        const seasonResult   = results[1].data;
        const episodeResult  = results[2].data;
        const survivorResult = results[3].data || [];

        let portfolioResult   = null;
        let leaderboardResult = null;
        let groupsResult      = [];
        if (privateRequests.length > 0) {
          portfolioResult   = results[4].data;
          leaderboardResult = results[5].data;
          groupsResult      = results[6].data || [];
        }

        const survivorsMap = (survivorResult || []).reduce((acc, player) => {
          acc[player.name] = player;
          return acc;
        }, {});

        if (!isMounted) return;

        setPrices(pricesResult);
        setSeasonData(seasonResult);
        setEpisodeData(episodeResult);
        setSurvivorPlayerStats(survivorsMap);
        // Initialise seen counts so we don't replay old events on load
        setSeenLiveEventCount((episodeResult.liveIdolEvents || []).length);
        setSeenLiveEventBonusCount((episodeResult.liveEventBonuses || []).length);
        setSeenChallengeEventCount((episodeResult.liveChallengeEvents || []).length);

        if (!user.isGuest && portfolioResult) {
          if (portfolioResult.groupId) setGroupId(String(portfolioResult.groupId));
          setFinancialData(portfolioResult);
          setUserGroups(groupsResult);
          setLeaderboard(leaderboardResult);
        } else {
          setFinancialData({
            user: {
              budget: user.budget,
              netWorth: user.netWorth,
              portfolio: user.portfolio || {},
              shorts: {},
              bonuses: [],
              liveBonusBalance: null,
              last_seen_episode_id: null,
            },
            prevNetWorth: null,
            maxPossibleBudget: null,
            maxPossibleLog: null,
            maxSharesPerPlayer: 50,
            availableShares: {},
            availableShorts: {},
            currentPrices: {},
            groupId: null,
          });
          setLeaderboard([]);
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

  // Track scroll so the HUD slides up in sync with the navbar
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Show elimination animation when the user visits for the first time this week
  useEffect(() => {
    const updateLastSeen = async () => {
      const week = seasonData?.currentWeek;
      const lastSeenWeek = financialData?.user?.last_seen_episode_id;
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
  }, [loading, seasonData, financialData, user]);

  // Poll for incoming trade offers
  useEffect(() => {
    if (user?.isGuest || !user?.id || !groupId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get('/trades/pending', { params: { userId: user.id, groupId } });
        setIncomingTrades(data);
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

  // Poll for on-air status changes and live events
  useEffect(() => {
    if (user?.isGuest) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get('/episode/getcurrentepisode');
        const isOnAir = data.onAir ?? false;

        if (prevOnAirRef.current !== null && prevOnAirRef.current !== isOnAir) {
          setRefreshTrigger((t) => t + 1);
        }
        prevOnAirRef.current = isOnAir;
        setEpisodeData(data);

        if (isOnAir) {
          const idolEvents = data.liveIdolEvents || [];
          if (idolEvents.length > seenLiveEventCount) {
            setPendingIdolNotifications((prev) => [...prev, ...idolEvents.slice(seenLiveEventCount)]);
            setSeenLiveEventCount(idolEvents.length);
          }

          const eventBonuses = data.liveEventBonuses || [];
          if (eventBonuses.length > seenLiveEventBonusCount) {
            const nonChallenge = eventBonuses.slice(seenLiveEventBonusCount).filter(
              b => b.field !== 'wonChallenge' && b.field !== 'lostChallenge'
            );
            if (nonChallenge.length > 0) setPendingEventNotifications((prev) => [...prev, ...nonChallenge]);
            setSeenLiveEventBonusCount(eventBonuses.length);
          }

          const challengeEvents = data.liveChallengeEvents || [];
          if (challengeEvents.length > seenChallengeEventCount) {
            setPendingChallengeNotifications((prev) => [...prev, ...challengeEvents.slice(seenChallengeEventCount)]);
            setSeenChallengeEventCount(challengeEvents.length);
          }
        }
      } catch { /* silent */ }
    }, 6000);
    return () => clearInterval(interval);
  }, [user, seenLiveEventCount, seenLiveEventBonusCount, seenChallengeEventCount]);

  // ── Sorting ──
  const stockOrder = (mode) => {
    const active = [];
    const eliminated = [];
    Object.keys(sharesOwned).forEach((k) => {
      const survivor = survivorPlayerStats[k];
      const shares   = sharesOwned[k] ?? 0;
      const priceNow = seasonData?.currentWeek === 0 ? (seasonData?.currentPrice ?? 0) : (prices[k] ?? 0);
      if (survivor?.availability) {
        active.push({ k, shares, value: shares * priceNow, name: survivor.name });
      } else {
        eliminated.push({ k, name: survivor.name });
      }
    });

    if (mode === "name") {
      active.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      active.sort((a, b) => b.shares !== a.shares ? b.shares - a.shares : a.k.localeCompare(b.k));
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
      const added   = keys.filter((k) => !new Set(still).has(k));
      return [...still, ...added];
    });
  }, [sharesOwned]);

  useEffect(() => {
    if (!displayOrder.length) return;
    const ideal = stockOrder(appliedSort);
    setIsSortStale(!(ideal.length === displayOrder.length && ideal.every((k, i) => k === displayOrder[i])));
  }, [sharesOwned, prices, seasonData, appliedSort, displayOrder, survivorPlayerStats]);

  // ── Portfolio refresh helpers ──
  const refreshFinancials = async (fields = "all") => {
    if (user?.isGuest || !groupId) return;
    try {
      const { data } = await axios.get("/transactions/getportfolio", { params: { userId: user.id, groupId } });
      if (fields === "budget") {
        setFinancialData(prev => ({
          ...prev,
          user: { ...prev.user, budget: data.user.budget, netWorth: data.user.netWorth, liveBonusBalance: data.user.liveBonusBalance ?? null },
        }));
      } else {
        setFinancialData(prev => ({
          ...prev,
          user: { ...prev.user, budget: data.user.budget, netWorth: data.user.netWorth, portfolio: data.user.portfolio },
          availableShares: data.availableShares ?? prev.availableShares,
          currentPrices: data.currentPrices ?? prev.currentPrices,
        }));
      }
    } catch { /* silent */ }
  };

  // ── Notification dismiss handlers ──
  const dismissIdolNotification = async () => {
    setPendingIdolNotifications((prev) => prev.slice(1));
    await refreshFinancials("budget");
  };
  const dismissEventNotification = async () => {
    setPendingEventNotifications((prev) => prev.slice(1));
    await refreshFinancials("budget");
  };
  const dismissChallengeNotification = () => setPendingChallengeNotifications((prev) => prev.slice(1));

  const dismissTradeAccept = async (tradeId) => {
    setPendingTradeNotifications((prev) => prev.slice(1));
    setIncomingTrades((prev) => prev.filter((t) => t._id !== tradeId));
    await refreshFinancials("all");
  };
  const dismissTradeDecline = (tradeId) => {
    setPendingTradeNotifications((prev) => prev.slice(1));
    setIncomingTrades((prev) => prev.filter((t) => t._id !== tradeId));
  };
  const dismissTradeClose = () => setPendingTradeNotifications((prev) => prev.slice(1));

  const handleAcceptIncoming = async (tradeId) => {
    setIncomingTrades((prev) => prev.filter((t) => t._id !== tradeId));
    await refreshFinancials("all");
  };
  const handleDeclineIncoming = (tradeId) => setIncomingTrades((prev) => prev.filter((t) => t._id !== tradeId));

  // ── Group switching ──
  const switchGroup = async (newGroupId) => {
    if (newGroupId === groupId) return;
    try {
      const { data } = await axios.get("/transactions/getportfolio", { params: { userId: user.id, groupId: newGroupId } });
      setGroupId(String(data.groupId));
      setFinancialData(data);
    } catch {
      toast.error("Failed to switch group");
    }
  };

  // ── Loading ──
  if (loading || loadingFinancials)
    return (
      <div style={{ minHeight: "100vh", background: J.bg, display: "grid", placeItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="animate-spin" style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${J.divider}`, borderTopColor: J.greenBright }} />
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase", color: J.greenBright }}>
            Loading…
          </p>
        </div>
      </div>
    );

  // ── Portfolio update (buy / sell / short / cover) ──
  const calculateTierPrice = (sharesUsed, groupMax) => {
    const pct = sharesUsed / groupMax;
    if (pct < 0.2) return 1;
    if (pct < 0.4) return 2;
    if (pct < 0.6) return 3;
    if (pct < 0.8) return 4;
    return 5;
  };

  const resetPrices = async () => {
    try { const { data } = await axios.get("/transactions/getprices"); setPrices(data); }
    catch (error) { console.log(error); }
  };

  const updatePortfolio = async (survivorPlayer, amount, action) => {
    if (!user) return;

    if (user.isGuest) {
      const price = seasonData.currentWeek === 0 ? 5 : (prices[survivorPlayer] || 0);
      const buySellAmount = action === "buy" ? amount : -amount;
      const currentShares = sharesOwned[survivorPlayer] || 0;
      let newShares;

      if (action === "buy") {
        if (financialData.user.budget >= amount * price) { newShares = currentShares + amount; }
        else { toast.error("Not enough funds"); return; }
      } else if (action === "sell") {
        if (currentShares >= amount) { newShares = currentShares - amount; }
        else { toast.error("No stock to sell."); return; }
      }

      const updatedPortfolio = { ...sharesOwned, [survivorPlayer]: newShares };
      const updatedNetWorth  = financialData.user.netWorth + buySellAmount * price;
      const updatedBudget    = financialData.user.budget - buySellAmount * price;

      setFinancialData(prev => ({
        ...prev,
        user: { ...prev.user, budget: updatedBudget, netWorth: updatedNetWorth, portfolio: updatedPortfolio },
      }));
      updateUser({ portfolio: updatedPortfolio, budget: updatedBudget, netWorth: updatedNetWorth });
      sessionStorage.setItem("guest_portfolio", JSON.stringify(updatedPortfolio));
      sessionStorage.setItem("guest_netWorth", updatedNetWorth);
      sessionStorage.setItem("guest_budget", updatedBudget);
    } else {
      try {
        const { data } = await axios.put("/transactions/updateportfoliopreseason", {
          userId: user.id, groupId, survivorPlayer, amount, action,
        });
        if (data.error) {
          toast.error(data.error);
        } else {
          resetPrices();
          if (action === "short" || action === "cover") {
            setFinancialData(prev => ({
              ...prev,
              user: {
                ...prev.user,
                budget: data.budget,
                netWorth: data.netWorth,
                liveBonusBalance: data.lockedBudget != null ? Math.max(0, data.budget - data.lockedBudget) : prev.user.liveBonusBalance,
                shorts: { ...prev.user.shorts, ...data.shorts },
              },
              availableShorts: {
                ...prev.availableShorts,
                [survivorPlayer]: (prev.availableShorts[survivorPlayer] ?? prev.maxSharesPerPlayer) + (action === "short" ? -amount : amount),
              },
            }));
          } else {
            setFinancialData(prev => {
              const newAvailable = (prev.availableShares[survivorPlayer] ?? prev.maxSharesPerPlayer) + (action === "buy" ? -amount : amount);
              const newUsed = prev.maxSharesPerPlayer - newAvailable;
              return {
                ...prev,
                user: {
                  ...prev.user,
                  budget: data.budget,
                  netWorth: data.netWorth,
                  liveBonusBalance: data.lockedBudget != null ? Math.max(0, data.budget - data.lockedBudget) : prev.user.liveBonusBalance,
                  portfolio: { ...prev.user.portfolio, ...data.portfolio },
                },
                availableShares: { ...prev.availableShares, [survivorPlayer]: newAvailable },
                currentPrices: { ...prev.currentPrices, [survivorPlayer]: calculateTierPrice(newUsed, prev.maxSharesPerPlayer) },
              };
            });
          }
        }
      } catch {
        toast.error("Something went wrong updating your portfolio.");
      }
    }
  };

  const buyStock   = (s, a) => updatePortfolio(s, a, "buy");
  const sellStock  = (s, a) => updatePortfolio(s, a, "sell");
  const shortStock = (s, a) => updatePortfolio(s, a, "short");
  const coverShort = (s, a) => updatePortfolio(s, a, "cover");

  return (
    <>
      {/* ── Fullscreen notification overlays ── */}
      {pendingIdolNotifications.length > 0 && (() => {
        const evt = pendingIdolNotifications[0];
        return (
          <LiveIdolNotification
            survivorName={evt.survivorName}
            bonusPerShare={evt.bonusPerShare ?? 0.50}
            sharesOwned={sharesOwned[evt.survivorName] ?? 0}
            survivorProfilePic={survivorPlayerStats[evt.survivorName]?.profile_pic ?? null}
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
          onAccept={dismissTradeAccept}
          onDecline={dismissTradeDecline}
          onClose={dismissTradeClose}
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

      {showTradeModal && (
        <TradeOfferModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          groupId={groupId}
          userId={user.id}
          groupMembers={groupMembers}
          myPortfolio={sharesOwned}
          myBudget={financialData.user.budget}
          survivorNames={Object.keys(survivorPlayerStats)}
          onTradeSent={() => setShowTradeModal(false)}
          incomingTrades={incomingTrades}
          onAcceptIncoming={handleAcceptIncoming}
          onDeclineIncoming={handleDeclineIncoming}
        />
      )}

      {showAnimation && Number(seasonData.currentWeek) > 0 && (
        <EliminationSequence
          week={seasonData.currentWeek}
          eliminatedSurvivors={episodeData.lastEpisodeVotedOut ?? []}
          survivorPlayerStats={survivorPlayerStats}
          sharesOwned={sharesOwned}
          prices={prices}
          medianPrice={seasonData.currentPrice}
          prevNetWorth={financialData.prevNetWorth}
          netWorth={financialData.user.netWorth}
          bonuses={financialData.user.bonuses ?? []}
          onFinish={() => setShowAnimation(false)}
        />
      )}

      {/* ── Page layout ── */}
      <div style={{ minHeight: "100vh", background: J.bg, color: J.text, paddingTop: NAVBAR_H + HUD_H }}>
        <DashboardHUD
          scrollY={scrollY}
          seasonData={seasonData}
          episodeData={episodeData}
          financialData={financialData}
          user={user}
          userGroups={userGroups}
          groupId={groupId}
          onSwitchGroup={switchGroup}
          appliedSort={appliedSort}
          isSortStale={isSortStale}
          onSort={(mode) => { setDisplayOrder(stockOrder(mode)); setAppliedSort(mode); setIsSortStale(false); }}
          groupMembers={groupMembers}
          incomingTrades={incomingTrades}
          onShowTradeModal={() => setShowTradeModal(true)}
          leaderboard={leaderboard}
        />

        <DashboardHero
          user={user}
          seasonData={seasonData}
          episodeData={episodeData}
          financialData={financialData}
        />

        <LiveBanners episodeData={episodeData} />

        <div
          className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[560px_1fr]"
          style={{ padding: "24px 28px 60px", gap: 24, alignItems: "start" }}
        >
          <div className="lg:sticky" style={{ top: 112, maxHeight: "calc(100vh - 130px)", overflowY: "auto" }}>
            <BootOrder
              groupId={groupId}
              bootOrders={financialData.user.bootOrders ?? {}}
            />
          </div>

          <main>
            <PlayerGrid
              displayOrder={displayOrder}
              survivorPlayerStats={survivorPlayerStats}
              financialData={financialData}
              sharesOwned={sharesOwned}
              shortsOwned={shortsOwned}
              episodeData={episodeData}
              buyStock={buyStock}
              sellStock={sellStock}
              shortStock={shortStock}
              coverShort={coverShort}
            />
          </main>
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .hud-controls::-webkit-scrollbar { display: none; }
        .hud-controls { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
