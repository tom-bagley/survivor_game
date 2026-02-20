import PlayerCard from "./BootOrderPlayerCard";
import { useEffect, useState, useContext } from "react";
import { UserContext } from "../../context/userContext";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function BootOrder({ groupId }) {
  const { user, updateUser, loading} = useContext(UserContext);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [episodeData, setEpisodeData] = useState({})

  useEffect(() => {
    async function getPlayers() {
      try {
        const { data } = await axios.get("/players/allplayers");
        setPlayers(data.filter(p => p.availability));
      } catch (err) {
        console.error("Error fetching players", err);
        toast.error("Failed to load players");
      } finally {
        setIsLoading(false);
      }
    }
    getPlayers();
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    async function getCurrentEpisode() {
      const { data } = await axios.get("/episode/getcurrentepisode");
      setEpisodeData(data);
    }
    getCurrentEpisode();
  }, [loading, user]);

  function handleDragStart(e, index) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnter(index) {
    if (index !== dragIndex) setOverIndex(index);
  }

  function handleDragEnd() {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const next = [...players];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIndex, 0, moved);
      setPlayers(next);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderPayload = players.map((p) => p.name);
      if (user?.isGuest) {
        updateUser({
          bootOrders: {
            ...(user.bootOrders || {}),
            [episodeData.episodeNumber]: orderPayload,
          },
        });
      } else {
        await axios.put("/transactions/save-boot-order", {
          order: orderPayload,
          userId: user.id,
          groupId,
          episodeNumber: episodeData.episodeNumber,
        });
      }
      toast.success("Boot order saved!");
    } catch (err) {
      console.error("Error saving", err);
      toast.error("Failed to save order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-charcoal/80 ring-1 ring-white/10 shadow-xl p-6 mb-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl tracking-tight">Boot Order</h2>
          <p className="text-sm text-white/50 mt-0.5">
            Drag to rank who gets voted out first — #1 is first out
          </p>
          {/* Payout scale */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {[100, 80, 60, 40, 20].map((bonus, i) => (
              <span key={i} className="text-xs text-white/40">
                <span className="font-semibold text-accent">#{i + 1}</span>
                {" "}→{" "}
                <span className="text-white/70">+${bonus}</span>
              </span>
            ))}
            <span className="text-xs text-white/30">#6+ → $0</span>
          </div>
        </div>
        {!isLoading && players.length > 0 && (
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="shrink-0 rounded-lg bg-primary text-black font-semibold px-4 py-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/70 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save Order"}
          </button>
        )}
      </div>

      {/* Scroll tray */}
      <div className="relative">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-charcoal to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-charcoal to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-4 overflow-x-auto py-3 px-14 items-center"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-32 h-52 rounded-xl bg-black/30 ring-1 ring-white/10 flex-shrink-0 animate-pulse"
                />
              ))
            : players.map((player, index) => (
                <div
                  key={player._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex-shrink-0"
                >
                  <PlayerCard
                    player={player}
                    rank={index + 1}
                    isDragging={dragIndex === index}
                    isOver={overIndex === index}
                    overDirection={dragIndex < index ? "right" : "left"}
                  />
                </div>
              ))}
        </div>
      </div>

      {/* Castaway count */}
      {!isLoading && (
        <div className="mt-3 text-center">
          <span className="text-xs text-white/25 uppercase tracking-widest">
            {players.length} castaways remaining
          </span>
        </div>
      )}
    </div>
  );
}
