import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import { Link } from "react-router-dom";
import axios from "axios";
import BootOrder from "../components/BootOrder";
import BuyStockDisplay from "../components/BuyStockDisplay";


export default function userGameplay () {
    const { user, updateUser, loading} = useContext(UserContext);
    const [searchParams] = useSearchParams();
    const groupId = searchParams.get("groupId");
    const [survivors, setSurvivors] = useState([])
    const [financialData, setFinancialData] = useState({
        portfolio: {},
        budget: 0
    });
    const [episodeData, setEpisodeData] = useState({})

    useEffect(() => {
        if (loading || !user) return;
        async function getPlayers () {
            try {
                const { data } = await axios.get("/players/allplayers")
                setSurvivors(data);
            } catch (err) {
                console.error("Error fetching players", err)
            }
        }
        getPlayers();
    }, [loading, user])

    useEffect(() => {
        if (loading || !user || !groupId) return;
        async function getUserFinancials () {
            const  { data } = await axios.get("/transactions/getportfolio", { params: { userId: user.id, groupId } })
            setFinancialData(data.user)
        }

        getUserFinancials();
    }, [loading, user, groupId])

    useEffect(() => {
      if(loading||!user) return;
      async function getCurrentEpisode () {
        const { data } = await axios.get("/episode/getcurrentepisode")
        setEpisodeData(data)
      }
      getCurrentEpisode();
    }, [loading, user])

    const updatePortfolio = async (survivorPlayer, amount, action) => {
        if (!user || !groupId) return;

        const { data } = await axios.put("/transactions/updateportfoliopreseason", {
            userId: user.id,
            groupId,
            survivorPlayer,
            amount,
            action
        })

        setFinancialData(prev => ({
            ...prev,
            portfolio: data.portfolio,
            budget: data.budget
        }));
    };

    const buyStock = (survivorPlayer, amount) => updatePortfolio(survivorPlayer, amount, "buy");
    const sellStock = (survivorPlayer, amount) => updatePortfolio(survivorPlayer, amount, "sell");

return (
  <div className="min-h-screen bg-background px-6 py-8 space-y-10">

    {/* ===== Section 1: Header + Budget ===== */}
    <section className="max-w-6xl mx-auto space-y-6">

      {/* Welcome */}
      <div>
        <h1 className="font-heading text-4xl lg:text-5xl tracking-tight">
          {user
            ? user.isGuest
              ? ""
              : <>Welcome, <span className="text-accent">{user.name}</span>!</>
            : "Welcome to the site!"}
        </h1>
      </div>

      {/* Budget Card */}
      <div className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60 uppercase tracking-wide">
            Available Budget
          </p>
          <p className="text-3xl font-heading text-primary mt-1">
            ${financialData.budget.toLocaleString()}
          </p>
        </div>
      </div>

    </section>

    {/* ===== Section 2: Market ===== */}
    <section className="max-w-6xl mx-auto space-y-8">

      {/* Boot Order */}
      <BootOrder groupId={groupId} />

      {/* Player Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        {survivors.map((survivorPlayer) => (
          <BuyStockDisplay
            key={survivorPlayer._id}
            name={survivorPlayer.name}
            profilePhotoUrl={survivorPlayer.profile_pic}
            shares={financialData.portfolio?.[survivorPlayer.name] ?? 0}
            buyStock={buyStock}
            sellStock={sellStock}
          />
        ))}
      </div>

    </section>

  </div>
);

}

