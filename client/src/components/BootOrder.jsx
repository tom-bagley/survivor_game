import PlayerCard from "./BootOrderPlayerCard";
import { useEffect, useState, useContext } from "react";
import { UserContext } from "../../context/userContext";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function BootOrder({ groupId, bootOrders = {} }) {
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
      const [playersRes, episodeRes] = await Promise.all([
        axios.get("/players/allplayers"),
        axios.get("/episode/getcurrentepisode")
      ]);

      const playersData = playersRes.data;
      const episodeData = episodeRes.data;

      setEpisodeData(episodeData)
      console.log(bootOrders[episodeData.episodeNumber])

      const relevantOrder = bootOrders?.[episodeData.episodeNumber];

      if (relevantOrder) {
        
        const orderedPlayers = relevantOrder
          .map(name => playersData.find(p => p.name === name))
          .filter(Boolean); 

        setPlayers(orderedPlayers);
      } else {
        setPlayers(playersData.filter(p => p.availability));
      }

    } catch (err) {
      console.error("Error fetching players", err);
      toast.error("Failed to load players");
    } finally {
      setIsLoading(false);
    }
  }

  getPlayers();
}, []);





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
    <div
      className="rounded-2xl shadow-xl p-6 mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(15,35,64,0.9) 0%, rgba(11,26,44,0.95) 100%)",
        border: "1px solid rgba(196,152,90,0.2)",
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl tracking-tight">Who is most likely to go home this week?</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(245,237,208,0.5)" }}>
            Win bonus if the player you think is going home goes home. Lose points if someone you think is safe goes home.
          </p>

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

      {/* Ranked list */}
      <div className="flex flex-col gap-1.5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl animate-pulse"
                style={{ background: "rgba(196,152,90,0.06)", border: "1px solid rgba(196,152,90,0.1)" }}
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
              >
                <PlayerCard
                  player={player}
                  rank={index + 1}
                  totalPlayers={players.length}
                  isDragging={dragIndex === index}
                  isOver={overIndex === index}
                  overDirection={dragIndex < index ? "right" : "left"}
                />
              </div>
            ))}
      </div>

      {/* Castaway count */}
      {!isLoading && (
        <div className="mt-3 text-center">
          <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(245,237,208,0.25)" }}>
            {players.length} castaways remaining
          </span>
        </div>
      )}
    </div>
  );
}
