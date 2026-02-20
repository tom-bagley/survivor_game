import { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import BuyOrShortDisplay from "../../components/BuyOrShortStockDisplay";
import EliminationSequence from "../../components/EliminationSequence";
import BootOrder from "../../components/BootOrder";
import ScoreEfficiencyBar from "../../components/ScoreEfficiencyBar";

export default function Dashboard() {
  const { user, updateUser, loading, from_invite } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const urlGroupId = searchParams.get("groupId");
  const [groupId, setGroupId] = useState(urlGroupId);
  const [budget, setBudget] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [prevNetWorth, setPrevNetWorth] = useState(null);
  const [maxPossibleBudget, setMaxPossibleBudget] = useState(null);
  const [bonuses, setBonuses] = useState([]);
  const [sharesOwned, setSharesOwned] = useState({});
  const [availableShares, setAvailableShares] = useState({});
  const [shortsOwned, setShortsOwned] = useState({});
  const [availableShorts, setAvailableShorts] = useState({});
  const [maxSharesPerPlayer, setMaxSharesPerPlayer] = useState(50);
  const [survivorPlayerStats, setSurvivorPlayerStats] = useState({});
  const [prices, setPrices] = useState({});
  const [leaderboard, setLeaderboard] = useState({});
  const [loadingFinancials, setLoadingFinancials] = useState(true);
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
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef(null);

  useEffect(() => {
    if (loading || !user) return; // wait for outer loading or user to exist

    let isMounted = true; // prevent state updates if unmounted

    async function getData() {
      try {
        // Public requests for everyone
        const publicRequests = [
          axios.get("/transactions/getprices"),
          axios.get("/admin/getcurrentseason"),
          axios.get("/episode/getcurrentepisode"),
          axios.get("/transactions/getprofile"), // public player list
        ];

        // Only real signed-in users call private endpoints
        const privateRequests =
          user.isGuest || !user.id
            ? []
            : [
                axios.get("/transactions/getportfolio", { params: { userId: user.id, groupId } }),
                axios.get(`/leaderboard/getleaderboard/${user.id}`),
                axios.get("/groups/user-groups", { params: { userId: user.id } }),
              ];

        const results = await Promise.all([...publicRequests, ...privateRequests]);

        // Map public results
        const pricesData = results[0].data;
        const seasonData = results[1].data;
        const episodeData = results[2].data;
        const survivorPlayersData = results[3].data || [];

        // Map private results if any
        let financialData = null;
        let leaderboardRank = null;
        let groupsData = [];
        if (privateRequests.length > 0) {
          financialData = results[4].data;
          leaderboardRank = results[5].data;
          groupsData = results[6].data || [];
        }

        // Build survivors map
        const survivorsMap = (survivorPlayersData || []).reduce((acc, player) => {
          acc[player.name] = player;
          return acc;
        }, {});

        if (!isMounted) return;

        // Always set these
        setPrices(pricesData);
        setWeek(seasonData.currentWeek);
        setSeason(seasonData.seasonName);
        setMedianPrice(seasonData.currentPrice);
        setSurvivorPlayerStats(survivorsMap);
        setEliminatedSurvivors(episodeData.survivorsVotedOut);

        if (!user.isGuest && financialData) {
          // Real signed-in user
          if (financialData.groupId) setGroupId(String(financialData.groupId));
          setBudget(financialData.user.budget);
          setNetWorth(financialData.user.netWorth);
          // Seed every survivor at 0, then overlay actual holdings so all cards render
          const fullPortfolio = {};
          survivorPlayersData.forEach(s => { fullPortfolio[s.name] = 0; });
          Object.assign(fullPortfolio, financialData.user.portfolio);
          setSharesOwned(fullPortfolio);
          if (financialData.availableShares) setAvailableShares(financialData.availableShares);
          if (financialData.availableShorts) setAvailableShorts(financialData.availableShorts);
          const fullShorts = {};
          survivorPlayersData.forEach(s => { fullShorts[s.name] = 0; });
          Object.assign(fullShorts, financialData.user.shorts);
          setShortsOwned(fullShorts);
          setMaxPossibleBudget(financialData.maxPossibleBudget ?? null);
          if (financialData.maxSharesPerPlayer) setMaxSharesPerPlayer(financialData.maxSharesPerPlayer);
          setBonuses(financialData.user.bonuses || []);
          setUserGroups(groupsData);
          setLeaderboard(leaderboardRank);
          setLastSeenWeek(financialData.user.last_seen_episode_id);
          setPrevNetWorth(financialData.prevNetWorth);
        } else {
          // Guest or not signed in: sensible defaults
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

    return () => {
      isMounted = false;
    };
  }, [loading, user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target)) {
        setGroupDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchGroup = async (newGroupId) => {
    setGroupDropdownOpen(false);
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
      const fullShorts = {};
      Object.keys(survivorPlayerStats).forEach(name => { fullShorts[name] = 0; });
      Object.assign(fullShorts, data.user.shorts);
      setShortsOwned(fullShorts);
      if (data.maxSharesPerPlayer) setMaxSharesPerPlayer(data.maxSharesPerPlayer);
      setMaxPossibleBudget(data.maxPossibleBudget ?? null);
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

  const stockOrder = (mode) => {
    const keys = Object.keys(sharesOwned);

    // Split active vs eliminated
    const active = [];
    const eliminated = [];

    keys.forEach((k) => {
      const survivor = survivorPlayerStats[k];
      const shares = sharesOwned[k] ?? 0;
      const priceNow = week === 0 ? (medianPrice ?? 0) : (prices[k] ?? 0);
      const value = shares * priceNow;
      const name = survivor.name

      if (survivor?.availability) {
        active.push({ k, shares, value, name });
      } else {
        eliminated.push({ k, shares, value, name });
      }
    });

    // Sort active players according to mode
    
    if (mode === "name") {
      active.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });

    } else {
      // "stock"
      active.sort((a, b) => {
        if (b.shares !== a.shares) return b.shares - a.shares;
        return a.k.localeCompare(b.k);
      });
    }

    // Keep eliminated players at bottom (sorted by name here)
    eliminated.sort((a, b) => a.k.localeCompare(b.k));

    // Merge back together
    return [...active.map(x => x.k), ...eliminated.map(x => x.k)];
  };


  useEffect(() => {
    const keys = Object.keys(sharesOwned);

    setDisplayOrder((prev) => {
      if (!prev || prev.length === 0) {
        
        return stockOrder("name");
      }
      const setKeys = new Set(keys);
      const still = prev.filter((k) => setKeys.has(k));       
      const setPrev = new Set(still);
      const added = keys.filter((k) => !setPrev.has(k));      
      return [...still, ...added];
    });
  }, [sharesOwned]);

  useEffect(() => {
    if (!displayOrder.length) return;

    const ideal = stockOrder(appliedSort);
    const same =
      ideal.length === displayOrder.length &&
      ideal.every((k, i) => k === displayOrder[i]);

    setIsSortStale(!same);  
  }, [sharesOwned, prices, week, medianPrice, appliedSort, displayOrder, survivorPlayerStats]);

  // Loading
  if (loading || loadingFinancials)
    return (
      <div className="min-h-screen bg-black-bg text-white grid place-items-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
          <h1 className="mt-4 font-heading text-xl text-primary">Loading…</h1>
        </div>
      </div>
    );

  const updatePortfolio = async (survivorPlayer, amount, action) => {
    if (!user) return;

    // Guest buy/sell
      const handleGuestUpdate = (survivorPlayer, amount, action) => {
        let price
        if (week === 0) {
          price = 5
        } else {
          price = prices[survivorPlayer] || 0;
        }
        
        const buySellAmount = action === "buy" ? amount : -amount;
        const currentShares = sharesOwned[survivorPlayer] || 0;

        let newShares;

        if (action === "buy") {
          if (budget >= amount * price) { // assuming you have a `price` variable
            newShares = currentShares + amount;
          } else {
            toast.error("Not enough funds");
            return;
          }
        } else if (action === "sell") {
          if (currentShares >= amount) {
            newShares = currentShares - amount;
          } else {
            toast.error("No stock to sell.");
            return;
          }
        }

        // Update your sharesOwned with newShares here
        setSharesOwned((prev) => ({
          ...prev,
          [survivorPlayer]: newShares,
        }));

        // Update budget if needed
        if (action === "buy") {
          setBudget((prev) => prev - amount * price);
        } else if (action === "sell") {
          setBudget((prev) => prev + amount * price);
        }


        const updatedPortfolio = { ...sharesOwned, [survivorPlayer]: newShares };
        const updatedNetWorth = netWorth + buySellAmount * price;
        const updatedBudget = budget - buySellAmount * price;

        setSharesOwned(updatedPortfolio);
        setNetWorth(updatedNetWorth);
        setBudget(updatedBudget);

        updateUser({
          portfolio: updatedPortfolio,
          budget: updatedBudget,
          netWorth: updatedNetWorth,
        });

        // Persist locally
        sessionStorage.setItem("guest_portfolio", JSON.stringify(updatedPortfolio));
        sessionStorage.setItem("guest_netWorth", updatedNetWorth);
        sessionStorage.setItem("guest_budget", updatedBudget);
      }

    if (user.isGuest) {
      handleGuestUpdate(survivorPlayer, amount, action)
    } else {

      // --- Real user: API call ---
      try {
        const endpoint = "/transactions/updateportfoliopreseason";

        const { data } = await axios.put(endpoint, {
          userId: user.id,
          groupId,
          survivorPlayer,
          amount,
          action,
        });

        if (data.error) {
          toast.error(data.error);
        } else {
          resetPrices();
          setBudget(data.budget);
          setNetWorth(data.netWorth);
          if (action === 'short' || action === 'cover') {
            setShortsOwned(prev => ({ ...prev, ...data.shorts }));
            setAvailableShorts(prev => ({
              ...prev,
              [survivorPlayer]: (prev[survivorPlayer] ?? maxSharesPerPlayer) + (action === 'short' ? -amount : amount),
            }));
          } else {
            setSharesOwned(prev => ({ ...prev, ...data.portfolio }));
            setAvailableShares(prev => ({
              ...prev,
              [survivorPlayer]: (prev[survivorPlayer] ?? maxSharesPerPlayer) + (action === 'buy' ? -amount : amount),
            }));
          }
        }
      } catch (error) {
        toast.error("Something went wrong updating your portfolio.");
      }
    }
  };

  const buyStock = (survivorPlayer, amount) => updatePortfolio(survivorPlayer, amount, "buy");
  const sellStock = (survivorPlayer, amount) => updatePortfolio(survivorPlayer, amount, "sell");
  const shortStock = (survivorPlayer, amount) => updatePortfolio(survivorPlayer, amount, "short");
  const coverShort = (survivorPlayer, amount) => updatePortfolio(survivorPlayer, amount, "cover");

  const resetPrices = async () => {
    try {
      const { data } = await axios.get("/transactions/getprices");
      setPrices(data);
    } catch (error) {
      console.log(error);
    }
  };

  const formattedBudget = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(budget);
  const formattedNetWorth = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(netWorth);

  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  const rankValue = leaderboard && typeof leaderboard === 'object' ? leaderboard.rank : leaderboard;

return (
  <>
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

    <div className="min-h-screen bg-black-bg text-white">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10 py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-4xl lg:text-5xl tracking-tight">
                {user
                  ? user.isGuest
                    ? ""
                    : <>Welcome, <span className="text-accent">{user.name}</span>!</>
                  : "Welcome to the site!"}
              </h1>

              {/* Group selector — only for signed-in users with groups */}
              {!user?.isGuest && userGroups.length > 0 && (
                <div className="relative w-fit" ref={groupDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setGroupDropdownOpen(o => !o)}
                    className="flex items-center gap-2 rounded-xl bg-black/30 ring-1 ring-white/10 px-4 py-2 text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    <span className="text-white/50 text-xs uppercase tracking-widest">Group</span>
                    <span className="text-white font-semibold">
                      {userGroups.find(g => String(g._id) === String(groupId))?.displayName ?? '—'}
                    </span>
                    <svg className={`w-4 h-4 text-white/40 transition-transform ${groupDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {groupDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 z-50 min-w-[200px] rounded-2xl bg-charcoal ring-1 ring-white/10 shadow-2xl overflow-hidden">
                      {userGroups.map(g => {
                        const isActive = String(g._id) === String(groupId);
                        return (
                          <button
                            key={g._id}
                            type="button"
                            onClick={() => switchGroup(String(g._id))}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between gap-4 transition-colors
                              ${isActive ? "bg-primary/10 text-primary" : "text-white hover:bg-white/5"}`}
                          >
                            <span className="font-medium">{g.displayName}</span>
                            <span className="text-xs text-white/40">pool: {g.maxSharesPerPlayer}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Number(week) > 0 && (
                <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 px-5 py-4">
                  <div className="text-xs text-white/60">Rank</div>
                  <div className="text-2xl font-semibold">
                    {rankValue != null ? ordinal(rankValue) : '—'}
                  </div>
                </div>
              )}
              {Number(week) > 0 && (
                <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 px-5 py-4">
                  <div className="text-xs text-white/60">Net Worth</div>
                  <div className="text-2xl font-semibold">{formattedNetWorth}</div>
                </div>
              )}
              {Number(week) > 0 && (
                <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 px-5 py-4">
                  <div className="text-xs text-white/60">Budget</div>
                  <div className="text-2xl font-semibold">{formattedBudget}</div>
                </div>
              )}
            </div>
          </div>

          {/* Max-score efficiency bar — only for signed-in users after week 1 */}
          {!user?.isGuest && Number(week) > 0 && maxPossibleBudget != null && (
            <ScoreEfficiencyBar netWorth={netWorth} maxPossibleBudget={maxPossibleBudget} />
          )}
        </header>

        {/* Portfolio Title + Sort Buttons */}
        <div className="mb-4 flex items-center justify-between">
          {week < 1 && (
          <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 px-5 py-4">
              <div className="text-xs text-white/60">Budget</div>
              <div className="text-2xl font-semibold">{formattedBudget}</div>
            </div>
            )}
          <h2 className="font-heading text-2xl">
            {user && !user.isGuest ? "Your Portfolio" : ""}
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Sort by:</span>

            <button
              type="button"
              onClick={() => {
                if (appliedSort === "name") {
                  setDisplayOrder(stockOrder("stock")); 
                  setAppliedSort("stock")
                  setIsSortStale(false);
                } else {
                  setDisplayOrder(stockOrder("name")); 
                  setAppliedSort("name")
                  setIsSortStale(true);
                }
              }}
              aria-pressed={appliedSort === "stock" && !isSortStale}
              className={`rounded-xl px-3 py-1.5 text-sm ring-1 transition
                ${appliedSort === "stock" && !isSortStale
                  ? "bg-yellow-500/20 text-yellow-300 ring-yellow-300/40"
                  : "bg-black/30 text-white ring-white/10 hover:bg-white/5"}`}
            >
              Most Owned Shares
            </button>
          </div>
        </div>
        {/* Guest Info */}
        {!user || user.isGuest ? (
          <div className="mt-10 mb-6 p-6 bg-black/30 rounded-2xl text-center">
            <h2 className="font-heading text-2xl mb-4">
              Save Your Portfolio
            </h2>
            <p className="text-white/80 text-sm">
              To save your portfolio, you must{" "}
              <Link to="/register" className="text-accent underline">
                sign up
              </Link>
              , or if you already have an account, you can{" "}
              <Link to="/login" className="text-accent underline">
                login
              </Link>
              .
            </p>
          </div>
        ) : null}

        {/* Boot Order */}
        <BootOrder groupId={groupId} />

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayOrder.map((survivorPlayer) => {
            const survivor = survivorPlayerStats[survivorPlayer];
            if (!survivor) return null;

            const profile_pic = survivor.profile_pic;
            const shares = sharesOwned[survivorPlayer] ?? 0;
            const price = prices[survivorPlayer] ?? 0;
            const displayPrice = week === 0 ? (medianPrice ?? 0) : price;
            const holdingsValue = shares * displayPrice;
            const eliminated = !survivor.availability;
            const historical_prices = survivor.historicalprices;

            return (
              <div key={survivorPlayer} className="h-full">
                <BuyOrShortDisplay
                  name={survivorPlayer}
                  profilePhotoUrl={profile_pic}
                  shares={shares}
                  availableShares={availableShares[survivorPlayer] ?? maxSharesPerPlayer}
                  maxSharesPerPlayer={maxSharesPerPlayer}
                  shorts={shortsOwned[survivorPlayer] ?? 0}
                  availableShorts={availableShorts[survivorPlayer] ?? maxSharesPerPlayer}
                  buyStock={buyStock}
                  sellStock={sellStock}
                  shortStock={shortStock}
                  coverShort={coverShort}
                />
              </div>
            );
          })}
        </div>

        

      </div>
    </div>
  </>
);

}







