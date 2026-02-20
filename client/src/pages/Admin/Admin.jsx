import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const PLAYER_EVENT_FIELDS = [
  { key: "foundIdol",           label: "Found Idol",           color: "yellow" },
  { key: "wonChallenge",        label: "Won Challenge",        color: "blue"   },
  { key: "rightSideOfVote",     label: "Right Side of Vote",   color: "green"  },
  { key: "playedIdolCorrectly", label: "Played Idol Correctly",color: "purple" },
];

const colorMap = {
  yellow: "bg-yellow-400/20 text-yellow-400 ring-yellow-400/40 shadow-yellow-400/20 shadow-md",
  blue:   "bg-blue-400/20 text-blue-400 ring-blue-400/40 shadow-blue-400/20 shadow-md",
  green:  "bg-green-400/20 text-green-400 ring-green-400/40 shadow-green-400/20 shadow-md",
  purple: "bg-purple-400/20 text-purple-400 ring-purple-400/40 shadow-purple-400/20 shadow-md",
};

const dotMap = {
  yellow: "bg-yellow-400",
  blue:   "bg-blue-400",
  green:  "bg-green-400",
  purple: "bg-purple-400",
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

  const handleWeekChange = async () => {
    const newWeek = Number(week ?? 0) + 1;
    try {
      const res = await axios.post("/admin/change-week", { newWeek });
      if (res.data?.error) return toast.error(res.data.error);
      setWeek(newWeek);
      toast.success("Advanced to next week");
    } catch (err) {
      console.error(err);
      toast.error("Failed to change week");
    }
  };

  const handleOnAirStatusChange = async () => {
    try {
      const res = await axios.patch("/episode/changeonairstatus");
      if (res.data?.error) return toast.error(res.data.error);
      toast.success("On-air status toggled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update on-air status");
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
              <button type="button" onClick={handleWeekChange} className="rounded-lg bg-white/10 text-white font-semibold px-4 py-2 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70">Next Week</button>
            </div>
          </form>
        </section>

        {/* On-Air Status */}
        <section className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-5">
          <h2 className="font-heading text-2xl mb-3">On-Air Status</h2>
          <button type="button" onClick={handleOnAirStatusChange} className="rounded-lg bg-white/10 text-white font-semibold px-4 py-2 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70">
            Toggle On-Air
          </button>
        </section>

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

        {/* Current Episode Events */}
        <section className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-heading text-2xl">Episode Events</h2>
              {episode ? (
                <p className="text-white/50 text-sm mt-0.5">
                  Episode {episode.episodeNumber} · {episode.season}&nbsp;&nbsp;
                  {episode.onAir
                    ? <span className="text-green-400 font-medium">● On Air</span>
                    : <span className="text-white/30">Off Air</span>
                  }
                </p>
              ) : (
                <p className="text-white/40 text-sm mt-0.5">No active episode found</p>
              )}
            </div>
          </div>

          {episode && players.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLAYER_EVENT_FIELDS.map(({ key, label, color }) => {
                const selected = (episode[key] || []).flat(Infinity);
                return (
                  <div key={key} className="rounded-xl bg-black/20 ring-1 ring-white/10 p-4">
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2 h-2 rounded-full ${dotMap[color]}`} />
                      <span className="text-sm font-semibold text-white/80">{label}</span>
                      {selected.length > 0 && (
                        <span className="ml-auto text-xs text-white/40">
                          {selected.length} selected
                        </span>
                      )}
                    </div>

                    {/* Player toggle buttons */}
                    <div className="flex flex-wrap gap-2">
                      {players.map((p) => {
                        const active = selected.includes(p.name);
                        return (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => togglePlayerEvent(p.name, key, label)}
                            className={`
                              rounded-full px-3 py-1 text-xs font-medium ring-1
                              transition-all duration-150 focus:outline-none
                              ${active ? colorMap[color] : inactiveClass}
                            `}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/40 text-sm">
              {!episode ? "No active episode." : "No players loaded."}
            </p>
          )}
        </section>

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