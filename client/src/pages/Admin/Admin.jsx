import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const CHALLENGE_TYPES = [
  { key: "team",       label: "Team Challenge",         hasLosers: true  },
  { key: "reward",     label: "Reward Challenge",        hasLosers: true  },
  { key: "individual", label: "Individual Immunity",     hasLosers: false },
];

const colorMap = {
  yellow: "bg-yellow-400/20 text-yellow-400 ring-yellow-400/40 shadow-yellow-400/20 shadow-md",
  blue:   "bg-blue-400/20 text-blue-400 ring-blue-400/40 shadow-blue-400/20 shadow-md",
  green:  "bg-green-400/20 text-green-400 ring-green-400/40 shadow-green-400/20 shadow-md",
  purple: "bg-purple-400/20 text-purple-400 ring-purple-400/40 shadow-purple-400/20 shadow-md",
  red:    "bg-red-500/20 text-red-400 ring-red-500/40 shadow-red-500/20 shadow-md",
  orange: "bg-orange-400/20 text-orange-400 ring-orange-400/40 shadow-orange-400/20 shadow-md",
};

const dotMap = {
  yellow: "bg-yellow-400",
  blue:   "bg-blue-400",
  green:  "bg-green-400",
  purple: "bg-purple-400",
  red:    "bg-red-400",
  orange: "bg-orange-400",
};

const inactiveClass = "bg-white/5 text-white/40 ring-white/10 hover:bg-white/10 hover:text-white/60";

export default function Players() {
  const [data, setData] = useState({
    name: "",
    profile_pic: "",
    age: "",
    Hometown: "",
    Current_Residence: "",
    Occupation: "",
    seasonName: "",
    initialPrice: "",
    percentageIncrement: "",
    budget: "",
    initialSurvivorPrice: "",
    Link: "",
  });

  const [season, setSeason] = useState();
  const [week, setWeek] = useState();
  const [price, setPrice] = useState();
  const [increment, setIncrement] = useState();
  const [players, setPlayers] = useState([]);
  const [episode, setEpisode] = useState(null);
  const [finalists, setFinalists] = useState(["", "", ""]);
  const [awarding, setAwarding] = useState(false);

  // Challenge batch state
  const [challengeType, setChallengeType] = useState("team");
  const [challengeWinners, setChallengeWinners] = useState([]);
  const [challengeLosers, setChallengeLosers] = useState([]);
  const [applyingChallenge, setApplyingChallenge] = useState(false);

  // Vote results batch state
  const [voteRightSide, setVoteRightSide] = useState([]);
  const [voteWrongSide, setVoteWrongSide] = useState([]);
  const [applyingVote, setApplyingVote] = useState(false);

  const onChange = (field) => (e) =>
    setData((s) => ({ ...s, [field]: e.target.value }));

  // ----------------- API Functions -----------------
  const displayPlayers = async () => {
    try {
      const { data } = await axios.get("/admin/allplayers");
      setPlayers(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load players");
    }
  };

  const fetchCurrentEpisode = async () => {
    try {
      const { data } = await axios.get("/episode/getcurrentepisode");
      setEpisode(data);
      if (data?.finalists) {
        const f = ["", "", ""];
        data.finalists.forEach((n, i) => { f[i] = n; });
        setFinalists(f);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load episode");
    }
  };

  const addPlayer = async (e) => {
    e.preventDefault();
    const { name, profile_pic, age, Hometown, Current_Residence, Occupation, Link } = data;
    try {
      const res = await axios.post("/admin/addplayer", {
        name, profile_pic, age, Hometown, Current_Residence, Occupation, Link,
      });
      if (res.data?.error) return toast.error(res.data.error);
      setData((s) => ({ ...s, name: "", profile_pic: "", age: "", Hometown: "", Current_Residence: "", Occupation: "", Link: "" }));
      await displayPlayers();
      toast.success("Player added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add player");
    }
  };

  const deletePlayer = async (playerID) => {
    try {
      const { data } = await axios.delete(`/admin/deleteplayer/${playerID}`);
      if (data?.error) return toast.error(data.error);
      await displayPlayers();
      toast.success("Player deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete player");
    }
  };

  const makeUnavailable = async (playerID) => {
    try {
      const { data } = await axios.patch(`/admin/changeavailability/${playerID}`);
      if (data?.error) return toast.error(data.error);
      await displayPlayers();
      toast.success("Availability updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update availability");
    }
  };

  const togglePlayerEvent = async (playerName, field, label) => {
    try {
      const res = await axios.patch(`/admin/player/events`, { field, playerName });
      if (res.data?.error) return toast.error(res.data.error);

      // Optimistically update episode state
      setEpisode((prev) => {
        if (!prev) return prev;
        const current = prev[field] || [];
        const alreadySet = current.includes(playerName);
        return {
          ...prev,
          [field]: alreadySet
            ? current.filter((n) => n !== playerName)
            : [...current, playerName],
        };
      });

      toast.success(`${label} updated`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update ${label}`);
    }
  };

  const handleResetUsers = async (e) => {
    e.preventDefault();
    const { budget, initialSurvivorPrice } = data;
    try {
      const res = await axios.post("/admin/reset-users", { budget, initialSurvivorPrice });
      if (res.data?.error) return toast.error(res.data.error);
      toast.success("Users reset");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset users");
    }
  };

  const handleSeasonChange = async (e) => {
    e.preventDefault();
    const { seasonName, initialPrice, percentageIncrement } = data;
    try {
      const res = await axios.post("/admin/change-season", { seasonName, initialPrice, percentageIncrement });
      if (res.data?.error) return toast.error(res.data.error);
      setSeason(seasonName);
      setWeek(0);
      setPrice(initialPrice);
      setIncrement(percentageIncrement);
      toast.success("Season updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to change season");
    }
  };

  const handleSetFinalist = async (place, playerName) => {
    try {
      const res = await axios.patch("/admin/finalists/set", { place, playerName });
      if (res.data?.error) return toast.error(res.data.error);
      const updated = ["", "", ""];
      (res.data.finalists || []).forEach((n, i) => { updated[i] = n; });
      setFinalists(updated);
    } catch (err) {
      console.error(err);
      toast.error("Failed to set finalist");
    }
  };

  const handleAwardFinalistBonuses = async () => {
    if (!window.confirm("Award finalist bonuses? This should only be done once at the end of the season.")) return;
    setAwarding(true);
    try {
      const res = await axios.post("/admin/finalists/award");
      if (res.data?.error) return toast.error(res.data.error);
      toast.success("Finalist bonuses awarded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to award finalist bonuses");
    } finally {
      setAwarding(false);
    }
  };

  const handleOnAirStatusChange = async () => {
    try {
      const res = await axios.patch("/admin/changeonairstatus");
      if (res.data?.error) return toast.error(res.data.error);
      if (res.data?.weekAdvanced) {
        // Week was automatically advanced — refresh season stats
        const { data: currentSeason } = await axios.get("/admin/getcurrentseason");
        setSeason(currentSeason.seasonName);
        setWeek(currentSeason.currentWeek);
        setPrice(currentSeason.currentPrice);
        setIncrement(currentSeason.percentageIncrement);
        toast.success(`Episode ended — advanced to Week ${currentSeason.currentWeek}`);
      } else {
        toast.success("Episode is now live");
      }
      await fetchCurrentEpisode();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update on-air status");
    }
  };

  const handleTribalCouncilToggle = async () => {
    try {
      const res = await axios.patch("/admin/changetribalcouncil");
      if (res.data?.error) return toast.error(res.data.error);
      await fetchCurrentEpisode();
      toast.success(res.data.tribalCouncil ? "Tribal council started — all trading locked" : "Tribal council ended — bonus trading resumed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle tribal council");
    }
  };

  const handleVoteOut = async (playerId, playerName) => {
    try {
      const res = await axios.patch(`/admin/changeavailability/${playerId}`);
      if (res.data?.error) return toast.error(res.data.error);
      await displayPlayers();
      await fetchCurrentEpisode();
      toast.success(`${playerName} voted out`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to vote out player");
    }
  };

  const toggleChallengePick = (name, list, setList) => {
    setList(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleApplyChallengeBatch = async () => {
    if (challengeWinners.length === 0 && challengeLosers.length === 0) {
      return toast.error("Select at least one winner or loser");
    }
    setApplyingChallenge(true);
    try {
      const res = await axios.patch("/admin/challenge/batch", {
        challengeType,
        winners: challengeWinners,
        losers: challengeLosers,
      });
      if (res.data?.error) return toast.error(res.data.error);
      await fetchCurrentEpisode();
      setChallengeWinners([]);
      setChallengeLosers([]);
      toast.success(`${CHALLENGE_TYPES.find(t => t.key === challengeType)?.label} applied`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply challenge");
    } finally {
      setApplyingChallenge(false);
    }
  };

  const handleApplyVoteResults = async () => {
    if (voteRightSide.length === 0 && voteWrongSide.length === 0) {
      return toast.error("Select at least one player");
    }
    setApplyingVote(true);
    try {
      const res = await axios.patch("/admin/vote/batch", {
        rightSide: voteRightSide,
        wrongSide: voteWrongSide,
      });
      if (res.data?.error) return toast.error(res.data.error);
      await fetchCurrentEpisode();
      setVoteRightSide([]);
      setVoteWrongSide([]);
      toast.success("Vote results applied");
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply vote results");
    } finally {
      setApplyingVote(false);
    }
  };

  const handleApplyLiveIdolBonus = async (survivorName) => {
    try {
      const res = await axios.post("/admin/apply-live-idol-bonus", { survivorName });
      if (res.data?.error) return toast.error(res.data.error);
      await fetchCurrentEpisode();
      toast.success(`Live idol bonus applied for ${survivorName}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply live idol bonus");
    }
  };

  useEffect(() => {
    async function getCurrentSeason() {
      try {
        const { data: currentSeason } = await axios.get("/admin/getcurrentseason");
        setSeason(currentSeason.seasonName);
        setWeek(currentSeason.currentWeek);
        setPrice(currentSeason.currentPrice);
        setIncrement(currentSeason.percentageIncrement);
      } catch (err) {
        console.error(err);
      }
    }
    displayPlayers();
    getCurrentSeason();
    fetchCurrentEpisode();
  }, [week]);

  // ----------------- JSX -----------------
  return (
    <div className="min-h-screen bg-black-bg text-white">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8 lg:px-10 py-10 space-y-8">
        {/* Header */}
        <header>
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight">Admin</h1>
          <p className="text-white/70 mt-1">Manage players, season settings, and system status.</p>
        </header>

        {/* Add Players */}
        <section className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-5">
          <h2 className="font-heading text-2xl mb-4">Add Players</h2>
          <form onSubmit={addPlayer} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {["name", "profile_pic", "age", "Hometown", "Current_Residence", "Occupation", "Link"].map((field) => (
              <input
                key={field}
                className="rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/70"
                placeholder={field.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
                value={data[field]}
                onChange={onChange(field)}
                required={field === "name"}
              />
            ))}
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="rounded-lg bg-primary text-black font-semibold px-4 py-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70">
                Add Player
              </button>
            </div>
          </form>
        </section>

        {/* Season Adjustments */}
        <section className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <h2 className="font-heading text-2xl">Season Adjustments</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[["Season", season], ["Week", week], ["Price", price], ["Increment", increment]].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-black/30 ring-1 ring-white/10 px-3 py-2">
                  <div className="text-white/60">{label}</div>
                  <div className="font-semibold">{value ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSeasonChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input className="rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/70" placeholder="Season name" value={data.seasonName || ""} onChange={onChange("seasonName")} required />
            <input className="rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/70" placeholder="Initial price" value={data.initialPrice || ""} onChange={onChange("initialPrice")} required />
            <input className="rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/70" placeholder="Percent increment" value={data.percentageIncrement || ""} onChange={onChange("percentageIncrement")} required />
            <div className="sm:col-span-3 flex items-center gap-3">
              <button type="submit" className="rounded-lg bg-primary text-black font-semibold px-4 py-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70">Change Season</button>
            </div>
          </form>
        </section>

        {/* On-Air Status */}
        <section className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-2xl">On-Air Status</h2>
            {episode && (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${episode.onAir ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/40"}`}>
                {episode.onAir ? "● Live" : "○ Off Air"}
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm mb-3">
            {episode?.onAir
              ? "Turning off will end the episode and automatically advance to the next week."
              : "Turning on will start the live episode. Players can buy but not sell."}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleOnAirStatusChange}
              className={`rounded-lg font-semibold px-4 py-2 transition-colors focus:outline-none focus:ring-2 ${
                episode?.onAir
                  ? "bg-red-500/20 text-red-300 ring-red-500/40 hover:bg-red-500/30 focus:ring-red-400/60"
                  : "bg-green-500/20 text-green-300 ring-green-500/40 hover:bg-green-500/30 focus:ring-green-400/60"
              }`}
            >
              {episode?.onAir ? "End Episode & Advance Week" : "Start Episode"}
            </button>

            {episode?.onAir && (
              <button
                type="button"
                onClick={handleTribalCouncilToggle}
                className={`rounded-lg font-semibold px-4 py-2 transition-colors focus:outline-none focus:ring-2 ${
                  episode?.tribalCouncil
                    ? "bg-orange-500/30 text-orange-300 ring-orange-500/50 hover:bg-orange-500/40 focus:ring-orange-400/60"
                    : "bg-orange-500/10 text-orange-400/70 ring-orange-500/20 hover:bg-orange-500/20 hover:text-orange-300 focus:ring-orange-400/40"
                }`}
              >
                {episode?.tribalCouncil ? "🔥 End Tribal Council" : "🔥 Start Tribal Council"}
              </button>
            )}
          </div>
        </section>

        {/* Vote Out Survivors — only visible while episode is on air */}
        {episode?.onAir && (
          <section className="rounded-2xl ring-1 ring-red-500/30 bg-red-500/5 p-5">
            <div className="mb-4">
              <h2 className="font-heading text-2xl text-red-300">Vote Out Survivors</h2>
              <p className="text-white/50 text-sm mt-0.5">
                Mark who was voted out this episode. They'll appear in the elimination sequence.
              </p>
            </div>
            {players.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {players.map((p) => {
                  const votedOut = !p.availability;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => !votedOut && handleVoteOut(p._id, p.name)}
                      disabled={votedOut}
                      className={`
                        rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-all duration-150 focus:outline-none
                        ${votedOut
                          ? "bg-red-500/10 text-red-400/50 ring-red-500/20 cursor-not-allowed line-through"
                          : "bg-white/5 text-white/60 ring-white/20 hover:bg-red-500/20 hover:text-red-300 hover:ring-red-500/40 cursor-pointer"}
                      `}
                    >
                      {votedOut ? `✗ ${p.name}` : p.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No players loaded.</p>
            )}
          </section>
        )}

        {/* Live Idol Bonuses — only visible while episode is on air */}
        {episode?.onAir && (
          <section className="rounded-2xl ring-1 ring-yellow-500/30 bg-yellow-500/5 p-5">
            <div className="mb-4">
              <h2 className="font-heading text-2xl text-yellow-300">Live Idol Bonuses</h2>
              <p className="text-white/50 text-sm mt-0.5">
                Apply a +$0.50/share idol bonus immediately. Players with shares get notified and can reinvest.
              </p>
            </div>

            {players.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {players.filter(p => p.availability).map((p) => {
                  const applied = (episode.liveIdolEvents || []).some(e => e.survivorName === p.name);
                  return (
                    <button
                      key={p._id}
                      type="button"
                      disabled={applied}
                      onClick={() => handleApplyLiveIdolBonus(p.name)}
                      className={`
                        rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-all duration-150 focus:outline-none
                        ${applied
                          ? "bg-yellow-400/10 text-yellow-400/50 ring-yellow-400/20 cursor-not-allowed"
                          : "bg-yellow-400/20 text-yellow-300 ring-yellow-400/40 hover:bg-yellow-400/30 cursor-pointer shadow-md shadow-yellow-400/10"}
                      `}
                    >
                      {applied ? `✓ ${p.name}` : `⚡ ${p.name}`}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No players loaded.</p>
            )}
          </section>
        )}

        {/* Reset Users */}
        <section className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-5">
          <h2 className="font-heading text-2xl mb-4">Reset Users</h2>
          <form onSubmit={handleResetUsers} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/70" placeholder="Budget" value={data.budget || ""} onChange={onChange("budget")} required />
            <input className="rounded-lg bg-black/30 text-white placeholder-white/40 ring-1 ring-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/70" placeholder="Initial survivor price" value={data.initialSurvivorPrice || ""} onChange={onChange("initialSurvivorPrice")} required />
            <div className="sm:col-span-1 flex items-center">
              <button type="submit" className="rounded-lg bg-primary text-black font-semibold px-4 py-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70">Reset</button>
            </div>
          </form>
        </section>

        {/* Finale — Final Placement */}
        <section className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-5">
          <h2 className="font-heading text-2xl mb-1">Finale</h2>
          <p className="text-white/50 text-sm mb-5">Set the final three placements, then award bonuses once at season end.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              { place: 0, label: "1st Place",  rate: "+$5.00 / share", color: "text-yellow-400"  },
              { place: 1, label: "2nd Place",  rate: "+$1.00 / share", color: "text-white/70"    },
              { place: 2, label: "3rd Place",  rate: "+$0.50 / share", color: "text-orange-400"  },
            ].map(({ place, label, rate, color }) => (
              <div key={place} className="rounded-xl bg-black/20 ring-1 ring-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${color}`}>{label}</span>
                  <span className="text-xs text-white/40">{rate}</span>
                </div>
                <select
                  value={finalists[place]}
                  onChange={(e) => handleSetFinalist(place, e.target.value)}
                  className="w-full rounded-lg bg-black/40 text-white ring-1 ring-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/70"
                >
                  <option value="">— Select player —</option>
                  {players.map((p) => (
                    <option key={p._id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAwardFinalistBonuses}
            disabled={awarding || finalists.every((f) => !f)}
            className="rounded-lg bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40 font-semibold px-5 py-2 hover:bg-yellow-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/60 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {awarding ? "Awarding…" : "Award Finalist Bonuses"}
          </button>
        </section>

        {/* Challenges */}
        {episode?.onAir && (
          <section className="rounded-2xl ring-1 ring-blue-500/30 bg-blue-500/5 p-5">
            <div className="mb-4">
              <h2 className="font-heading text-2xl text-blue-300">Challenges</h2>
              <p className="text-white/50 text-sm mt-0.5">
                Select the challenge type, pick winners and losers, then apply all at once as a single notification.
              </p>
            </div>

            {/* Challenge type tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {CHALLENGE_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setChallengeType(key); setChallengeWinners([]); setChallengeLosers([]); }}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition-all duration-150 focus:outline-none ${
                    challengeType === key
                      ? "bg-blue-400/20 text-blue-300 ring-blue-400/40"
                      : "bg-white/5 text-white/40 ring-white/10 hover:bg-white/10 hover:text-white/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {players.length > 0 ? (
              <div className="mb-4">
                {challengeType === "team" ? (
                  /* Team Challenge — single unified grid: click cycles unselected → winner → loser → unselected */
                  <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-semibold text-white/80">Players</span>
                      <span className="text-xs text-white/40">Click once = winner · Click twice = loser · Click again = clear</span>
                      {(challengeWinners.length > 0 || challengeLosers.length > 0) && (
                        <span className="ml-auto text-xs text-blue-400">{challengeWinners.length}W</span>
                      )}
                      {challengeLosers.length > 0 && (
                        <span className="text-xs text-red-400">{challengeLosers.length}L</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {players.filter(p => p.availability).map((p) => {
                        const isWinner = challengeWinners.includes(p.name);
                        const isLoser  = challengeLosers.includes(p.name);
                        const alreadyApplied = (episode?.liveChallengeEvents || [])
                          .filter(e => e.challengeType === challengeType)
                          .some(e => (e.winners || []).includes(p.name) || (e.losers || []).includes(p.name));
                        const handleClick = () => {
                          if (isWinner) {
                            // winner → loser
                            setChallengeWinners(prev => prev.filter(n => n !== p.name));
                            setChallengeLosers(prev => [...prev, p.name]);
                          } else if (isLoser) {
                            // loser → unselected
                            setChallengeLosers(prev => prev.filter(n => n !== p.name));
                          } else {
                            // unselected → winner
                            setChallengeWinners(prev => [...prev, p.name]);
                          }
                        };
                        return (
                          <button
                            key={p._id}
                            type="button"
                            disabled={alreadyApplied}
                            onClick={handleClick}
                            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-all duration-150 focus:outline-none ${
                              alreadyApplied
                                ? "bg-blue-400/10 text-blue-400/40 ring-blue-400/20 cursor-not-allowed line-through"
                                : isWinner
                                ? "bg-blue-400/20 text-blue-400 ring-blue-400/40 shadow-md shadow-blue-400/20"
                                : isLoser
                                ? "bg-red-500/20 text-red-400 ring-red-500/40 shadow-md shadow-red-500/20"
                                : "bg-white/5 text-white/40 ring-white/10 hover:bg-white/10 hover:text-white/60"
                            }`}
                          >
                            {alreadyApplied ? `✓ ${p.name}` : isWinner ? `W · ${p.name}` : isLoser ? `L · ${p.name}` : p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Reward / Individual — two-panel layout */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Winners */}
                    <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-sm font-semibold text-white/80">
                          {challengeType === "individual" ? "Winner" : "Winners"}
                        </span>
                        {challengeWinners.length > 0 && (
                          <span className="ml-auto text-xs text-white/40">{challengeWinners.length} selected</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {players.filter(p => p.availability).map((p) => {
                          const active = challengeWinners.includes(p.name);
                          const alreadyApplied = (episode?.liveChallengeEvents || [])
                            .filter(e => e.challengeType === challengeType)
                            .some(e => (e.winners || []).includes(p.name));
                          return (
                            <button
                              key={p._id}
                              type="button"
                              disabled={alreadyApplied}
                              onClick={() => {
                                if (challengeType === "individual") {
                                  setChallengeWinners(prev => prev.includes(p.name) ? [] : [p.name]);
                                } else {
                                  toggleChallengePick(p.name, challengeWinners, setChallengeWinners);
                                }
                              }}
                              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-all duration-150 focus:outline-none ${
                                alreadyApplied
                                  ? "bg-blue-400/10 text-blue-400/40 ring-blue-400/20 cursor-not-allowed line-through"
                                  : active
                                  ? "bg-blue-400/20 text-blue-400 ring-blue-400/40 shadow-md shadow-blue-400/20"
                                  : "bg-white/5 text-white/40 ring-white/10 hover:bg-white/10 hover:text-white/60"
                              }`}
                            >
                              {alreadyApplied ? `✓ ${p.name}` : p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Losers — only for reward */}
                    {CHALLENGE_TYPES.find(t => t.key === challengeType)?.hasLosers && (
                      <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-sm font-semibold text-white/80">Losers</span>
                          {challengeLosers.length > 0 && (
                            <span className="ml-auto text-xs text-white/40">{challengeLosers.length} selected</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {players.filter(p => p.availability).map((p) => {
                            const active = challengeLosers.includes(p.name);
                            const alreadyApplied = (episode?.liveChallengeEvents || [])
                              .filter(e => e.challengeType === challengeType)
                              .some(e => (e.losers || []).includes(p.name));
                            return (
                              <button
                                key={p._id}
                                type="button"
                                disabled={alreadyApplied}
                                onClick={() => toggleChallengePick(p.name, challengeLosers, setChallengeLosers)}
                                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-all duration-150 focus:outline-none ${
                                  alreadyApplied
                                    ? "bg-red-500/10 text-red-400/40 ring-red-500/20 cursor-not-allowed line-through"
                                    : active
                                    ? "bg-red-500/20 text-red-400 ring-red-500/40 shadow-md shadow-red-500/20"
                                    : "bg-white/5 text-white/40 ring-white/10 hover:bg-white/10 hover:text-white/60"
                                }`}
                              >
                                {alreadyApplied ? `✓ ${p.name}` : p.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-sm mb-4">No players loaded.</p>
            )}

            <button
              type="button"
              onClick={handleApplyChallengeBatch}
              disabled={applyingChallenge || (challengeWinners.length === 0 && challengeLosers.length === 0)}
              className="rounded-lg bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40 font-semibold px-5 py-2 hover:bg-blue-500/30 transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {applyingChallenge ? "Applying…" : `Apply ${CHALLENGE_TYPES.find(t => t.key === challengeType)?.label}`}
            </button>
          </section>
        )}

        {/* Vote Results */}
        {episode?.onAir && (
          <section className="rounded-2xl ring-1 ring-green-500/30 bg-green-500/5 p-5">
            <div className="mb-4">
              <h2 className="font-heading text-2xl text-green-300">Vote Results</h2>
              <p className="text-white/50 text-sm mt-0.5">
                Select who was on each side of the vote, then apply all at once.
              </p>
            </div>

            {players.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Right side */}
                <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm font-semibold text-white/80">Right Side of Vote</span>
                    {voteRightSide.length > 0 && (
                      <span className="ml-auto text-xs text-white/40">{voteRightSide.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {players.filter((p) => p.availability).map((p) => {
                      const active = voteRightSide.includes(p.name);
                      const applied = (episode?.rightSideOfVote || []).flat(Infinity).includes(p.name);
                      return (
                        <button
                          key={p._id}
                          type="button"
                          disabled={applied}
                          onClick={() => setVoteRightSide((prev) =>
                            prev.includes(p.name) ? prev.filter((n) => n !== p.name) : [...prev, p.name]
                          )}
                          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-all duration-150 focus:outline-none ${
                            applied
                              ? "bg-green-400/10 text-green-400/40 ring-green-400/20 cursor-not-allowed line-through"
                              : active
                              ? "bg-green-400/20 text-green-400 ring-green-400/40 shadow-md shadow-green-400/20"
                              : inactiveClass
                          }`}
                        >
                          {applied ? `✓ ${p.name}` : p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Wrong side */}
                <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-sm font-semibold text-white/80">Wrong Side of Vote</span>
                    {voteWrongSide.length > 0 && (
                      <span className="ml-auto text-xs text-white/40">{voteWrongSide.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {players.filter((p) => p.availability).map((p) => {
                      const active = voteWrongSide.includes(p.name);
                      const applied = (episode?.wrongSideOfVote || []).flat(Infinity).includes(p.name);
                      return (
                        <button
                          key={p._id}
                          type="button"
                          disabled={applied}
                          onClick={() => setVoteWrongSide((prev) =>
                            prev.includes(p.name) ? prev.filter((n) => n !== p.name) : [...prev, p.name]
                          )}
                          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-all duration-150 focus:outline-none ${
                            applied
                              ? "bg-orange-400/10 text-orange-400/40 ring-orange-400/20 cursor-not-allowed line-through"
                              : active
                              ? "bg-orange-400/20 text-orange-400 ring-orange-400/40 shadow-md shadow-orange-400/20"
                              : inactiveClass
                          }`}
                        >
                          {applied ? `✓ ${p.name}` : p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-sm mb-4">No players loaded.</p>
            )}

            <button
              type="button"
              onClick={handleApplyVoteResults}
              disabled={applyingVote || (voteRightSide.length === 0 && voteWrongSide.length === 0)}
              className="rounded-lg bg-green-500/20 text-green-300 ring-1 ring-green-500/40 font-semibold px-5 py-2 hover:bg-green-500/30 transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {applyingVote ? "Applying…" : "Apply Vote Results"}
            </button>
          </section>
        )}

        {/* Idol Played Correctly */}
        {episode?.onAir && (
          <section className="rounded-2xl ring-1 ring-purple-500/30 bg-purple-500/5 p-5">
            <div className="mb-4">
              <h2 className="font-heading text-2xl text-purple-300">Idol Played Correctly</h2>
              <p className="text-white/50 text-sm mt-0.5">
                Mark survivors who successfully played a hidden immunity idol.
              </p>
            </div>

            {players.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {players.filter((p) => p.availability).map((p) => {
                  const applied = (episode?.playedIdolCorrectly || []).flat(Infinity).includes(p.name);
                  return (
                    <button
                      key={p._id}
                      type="button"
                      disabled={applied}
                      onClick={() => togglePlayerEvent(p.name, "playedIdolCorrectly", "Played Idol Correctly")}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-all duration-150 focus:outline-none ${
                        applied
                          ? "bg-purple-400/10 text-purple-400/50 ring-purple-400/20 cursor-not-allowed"
                          : "bg-purple-400/20 text-purple-300 ring-purple-400/40 hover:bg-purple-400/30 cursor-pointer shadow-md shadow-purple-400/10"
                      }`}
                    >
                      {applied ? `✓ ${p.name}` : `🛡 ${p.name}`}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No players loaded.</p>
            )}
          </section>
        )}

        {/* Players List */}
        <section className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-5">
          <h2 className="font-heading text-2xl mb-4">All Players</h2>
          {players.length > 0 ? (
            <ul className="divide-y divide-white/10">
              {players.map((p) => (
                <li key={p._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-white/60">
                      {p.availability ? "Available" : "Unavailable"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => makeUnavailable(p._id)}
                      className="rounded-lg bg-white/10 text-white px-3 py-1.5 text-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary/70"
                    >
                      Toggle Availability
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePlayer(p._id)}
                      className="rounded-lg bg-red-flame/20 text-red-flame px-3 py-1.5 text-sm hover:bg-red-flame/30 focus:outline-none focus:ring-2 focus:ring-red-flame/60"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/60">No players yet</p>
          )}
        </section>
      </div>
    </div>
  );
}