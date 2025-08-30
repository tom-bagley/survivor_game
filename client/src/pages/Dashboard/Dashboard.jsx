import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../context/userContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import Display from "../../components/dashboardDisplay/dashboardDisplay";
import EliminationSequence from "../../components/EliminationSequence";

export default function Dashboard() {
  const { user, loading } = useContext(UserContext);
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
  const [appliedSort, setAppliedSort] = useState("stock");
  const [isSortStale, setIsSortStale] = useState(false);  

  useEffect(() => {
    if (loading || !user?.id) return;
    async function getData() {
      try {
        const [
          { data: financialData },
          { data: pricesData },
          { data: survivorPlayersData },
          { data: leaderboardRank },
          { data: seasonData },
          { data: episodeData },
        ] = await Promise.all([
          axios.get("/transactions/getportfolio", { params: { userId: user.id } }),
          axios.get("/transactions/getprices"),
          axios.get("/transactions/getprofile"),
          axios.get(`/leaderboard/getleaderboard/${user.id}`),
          axios.get("/admin/getcurrentseason"),
          axios.get("/episode/getcurrentepisode"),
        ]);

        const survivorsMap = (survivorPlayersData || []).reduce((acc, player) => {
          acc[player.name] = player;
          return acc;
        }, {});

        setAdmin(seasonData);
        setWeek(seasonData.currentWeek);
        setSeason(seasonData.seasonName);
        setMedianPrice(seasonData.currentPrice);
        setBudget(financialData.user.budget);
        setNetWorth(financialData.user.netWorth);
        setSharesOwned(financialData.user.portfolio);
        setPrices(pricesData);
        setLeaderboard(leaderboardRank);
        setSurvivorPlayerStats(survivorsMap);
        setLastSeenWeek(financialData.user.last_seen_episode_id);
        setEliminatedSurvivors(episodeData.survivorsVotedOut);
        setPrevNetWorth(financialData.prevNetWorth);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingFinancials(false);
      }
    }

    getData();
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

    if (survivor?.availability) {
      active.push({ k, shares, value });
    } else {
      eliminated.push({ k, shares, value });
    }
  });

  // Sort active players according to mode
  if (mode === "value") {
    active.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.k.localeCompare(b.k);
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
      
      return stockOrder(appliedSort);
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

  // Not logged in
  if (!user?.id)
    return (
      <div className="min-h-screen bg-black-bg text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-white/20 grid place-items-center text-white/70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
              <path
                fillRule="evenodd"
                d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-6a6 6 0 0 0-4.472 10.085C4.584 10.97 6.203 10 8 10s3.416.97 4.472 2.085A6 6 0 0 0 8 2z"
              />
            </svg>
          </div>
          <h1 className="font-heading text-2xl">You’re not logged in</h1>
          <p className="text-white/60 mt-1">Please sign in to continue</p>
        </div>
      </div>
    );

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
                Welcome, <span className="text-accent">{user.name}</span>!
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
                <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 px-5 py-4">
                  <div className="text-xs text-white/60">Budget</div>
                  <div className="text-2xl font-semibold">{formattedBudget}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Portfolio Title */}

{/* Portfolio Title + Sort Buttons */}
<div className="mb-4 flex items-center justify-between">
  <h2 className="font-heading text-2xl">Your Portfolio</h2>

  <div className="flex items-center gap-2">
    <span className="text-sm text-white/60">Sort by:</span>

    <button
      type="button"
      onClick={() => {
        setDisplayOrder(stockOrder("stock")); 
        setAppliedSort("stock");
        setIsSortStale(false);
      }}
      aria-pressed={appliedSort === "stock" && !isSortStale}
      className={`rounded-xl px-3 py-1.5 text-sm ring-1 transition
        ${appliedSort === "stock" && !isSortStale
          ? "bg-yellow-500/20 text-yellow-300 ring-yellow-300/40"
          : "bg-black/30 text-white ring-white/10 hover:bg-white/5"}`}
    >
      Most Shares
    </button>
  </div>
</div>



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








