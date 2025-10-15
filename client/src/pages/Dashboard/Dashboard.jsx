import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../context/userContext";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Display from "../../components/dashboardDisplay/dashboardDisplay";
import EliminationSequence from "../../components/EliminationSequence";

export default function Dashboard() {
  const { user, updateUser, loading } = useContext(UserContext);
  const [budget, setBudget] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [prevNetWorth, setPrevNetWorth] = useState(null);
  const [sharesOwned, setSharesOwned] = useState({});
  const [survivorPlayerStats, setSurvivorPlayerStats] = useState({});
  const [prices, setPrices] = useState({});
  const [leaderboard, setLeaderboard] = useState({});
  const [loadingFinancials, setLoadingFinancials] = useState(true);
  const [season, setSeason] = useState([]);
  const [week, setWeek] = useState(null);
  const [medianPrice, setMedianPrice] = useState([]);
  const [admin, setAdmin] = useState([]);
  const [lastSeenWeek, setLastSeenWeek] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [eliminatedSurvivors, setEliminatedSurvivors] = useState([]);
  const [displayOrder, setDisplayOrder] = useState([]);
  const [appliedSort, setAppliedSort] = useState("name");
  const [isSortStale, setIsSortStale] = useState(false);  

  useEffect(() => {
    if (loading || !user) return; // wait for outer loading or user to exist
    console.log(user)

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
                axios.get("/transactions/getportfolio", { params: { userId: user.id } }),
                axios.get(`/leaderboard/getleaderboard/${user.id}`),
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
        if (privateRequests.length > 0) {
          financialData = results[4].data;
          leaderboardRank = results[5].data;
        }

        // Build survivors map
        const survivorsMap = (survivorPlayersData || []).reduce((acc, player) => {
          acc[player.name] = player;
          return acc;
        }, {});

        if (!isMounted) return;

        // Always set these
        setPrices(pricesData);
        setAdmin(seasonData);
        setWeek(seasonData.currentWeek);
        setSeason(seasonData.seasonName);
        setMedianPrice(seasonData.currentPrice);
        setSurvivorPlayerStats(survivorsMap);
        setEliminatedSurvivors(episodeData.survivorsVotedOut);

        if (!user.isGuest && financialData) {
          // Real signed-in user
          setBudget(financialData.user.budget);
          setNetWorth(financialData.user.netWorth);
          setSharesOwned(financialData.user.portfolio);
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

  // // Not logged in
  // if (!user?.id)
  //   return (
  //     <div className="min-h-screen bg-black-bg text-white flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-white/20 grid place-items-center text-white/70">
  //           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 16 16" fill="currentColor">
  //             <path d="M10 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
  //             <path
  //               fillRule="evenodd"
  //               d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-6a6 6 0 0 0-4.472 10.085C4.584 10.97 6.203 10 8 10s3.416.97 4.472 2.085A6 6 0 0 0 8 2z"
  //             />
  //           </svg>
  //         </div>
  //         <h1 className="font-heading text-2xl">You’re not logged in</h1>
  //         <p className="text-white/60 mt-1">Please sign in to continue</p>
  //       </div>
  //     </div>
  //   );

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
        const endpoint = week === 0 ? "/transactions/updateportfoliopreseason" : "/transactions/updateportfolio";

        const { data } = await axios.put(endpoint, {
          userId: user.id,
          survivorPlayer,
          amount,
          action,
        });

        if (data.error) {
          toast.error(data.error);
        } else {
          resetPrices();
          setSharesOwned(data.portfolio);
          setBudget(data.budget);
          setNetWorth(data.netWorth);
        }
      } catch (error) {
        toast.error("Something went wrong updating your portfolio.");
      }
    }
  };

  const buyStock = (survivorPlayer, amount) => updatePortfolio(survivorPlayer, amount, "buy");
  const sellStock = (survivorPlayer, amount) => updatePortfolio(survivorPlayer, amount, "sell");

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
        onFinish={() => setShowAnimation(false)}
      />
    )}

    <div className="min-h-screen bg-black-bg text-white">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10 py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <h1 className="font-heading text-4xl lg:text-5xl tracking-tight">
              {user
                ? user.isGuest
                  ? ""
                  : <>Welcome, <span className="text-accent">{user.name}</span>!</>
                : "Welcome to the site!"}
            </h1>

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
                <Display
                  name={survivorPlayer}
                  profilePhotoUrl={profile_pic}
                  shares={shares}
                  price={displayPrice}
                  holdingsValue={holdingsValue}
                  buyStock={buyStock}
                  sellStock={sellStock}
                  eliminated={eliminated}
                  season={season}
                  week={week}
                  historical_prices={historical_prices}
                  medianPrice={medianPrice}
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







