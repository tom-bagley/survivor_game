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

  // ----------------- Fetch players -----------------
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
        if(loading||!user) return;
        async function getCurrentEpisode () {
        const { data } = await axios.get("/episode/getcurrentepisode")
        setEpisodeData(data)
        }
        getCurrentEpisode();
    }, [loading, user])

  // ----------------- Drag & Drop -----------------
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

  // ----------------- Submit order -----------------
  const handleSubmitOrder = async () => {
    setIsSubmitting(true);

    try {
      const orderPayload = players.map((p) => p.name);

      if (user?.isGuest) {
        // Persist in guest session so it transfers on sign-up
        updateUser({
          bootOrders: {
            ...(user.bootOrders || {}),
            [episodeData.episodeNumber]: orderPayload,
          },
        });
      } else {
        await axios.put("/transactions/save-boot-order", { order: orderPayload, userId: user.id, groupId, episodeNumber: episodeData.episodeNumber });
      }

      toast.success("Player order saved!");
    } catch (err) {
      console.error("Error saving", err);
      toast.error("Failed to save order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Fonts & styles omitted for brevity */}
      
      <div
        style={{
          minHeight: "100vh",
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(140,70,10,0.3) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 80%, rgba(70,20,90,0.25) 0%, transparent 55%),
            linear-gradient(155deg, #0d0800 0%, #100b02 45%, #07030f 100%)
          `,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "5px 0 6px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20, padding: "0 10px" }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(255,200,80,0.45)",
              fontFamily: "'Cinzel', serif",
              marginBottom: 10,
            }}
          >
            Survivor Fantasy League
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(22px, 3.5vw, 42px)",
              fontFamily: "'Cinzel', serif",
              fontWeight: 900,
              letterSpacing: "0.1em",
              color: "#ffe8a0",
              textShadow: "0 0 50px rgba(200,130,40,0.55), 0 3px 6px rgba(0,0,0,0.9)",
              lineHeight: 1.1,
            }}
          >
            WHO GETS VOTED OUT THIS WEEK?
          </h1>
          <p
            style={{
              margin: "14px 0 0",
              fontSize: 15,
              color: "rgba(255,210,100,0.4)",
              fontStyle: "italic",
              fontFamily: "'Crimson Text', serif",
              letterSpacing: "0.06em",
            }}
          >
            Drag to rank contestants most likely to go home · #1 is first out
          </p>
        </div>

        {/* Scroll tray */}
        <div style={{ width: "100%", position: "relative" }}>
          {/* Edge fades */}
          <div
            style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 70,
              background: "linear-gradient(90deg, #0d0800, transparent)",
              zIndex: 10, pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: 70,
              background: "linear-gradient(270deg, #07030f, transparent)",
              zIndex: 10, pointerEvents: "none",
            }}
          />

          <div
            className="card-tray"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
              overflowX: "auto",
              padding: "20px 90px 30px",
              alignItems: "center",
            }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 130,
                      height: 210,
                      borderRadius: 18,
                      background: "rgba(40,25,10,0.55)",
                      border: "1px solid rgba(255,200,80,0.08)",
                      flexShrink: 0,
                      animation: `shimmer 1.5s ease-in-out ${i * 0.12}s infinite`,
                    }}
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
                    style={{
                      animation: `fadeUp 0.4s ease ${index * 0.07}s both`,
                      flexShrink: 0,
                    }}
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

        {/* Submit Button */}
        {!isLoading && players.length > 0 && (
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            style={{
              marginTop: 16,
              padding: "8px 24px",
              fontWeight: 600,
              borderRadius: 8,
              background: "#ffe8a0",
              color: "#000",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        )}

        {/* Footer */}
        {!isLoading && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,200,80,0.3))" }} />
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,200,80,0.3)",
                fontFamily: "'Cinzel', serif",
              }}
            >
              {players.length} castaways
            </span>
            <div style={{ width: 40, height: 1, background: "linear-gradient(270deg, transparent, rgba(255,200,80,0.3))" }} />
          </div>
        )}
      </div>
    </>
  );
}
