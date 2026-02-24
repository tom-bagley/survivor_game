import { useEffect, useRef, useState, useContext } from "react";
import { UserContext } from "../../context/userContext";
import axios from "axios";
import { toast } from "react-hot-toast";

// ─── helpers ──────────────────────────────────────────────────────────────────

const PALETTE = [
  ["#c8511b", "#7a2d00"], ["#1b6ca8", "#0d3d61"], ["#2d7a45", "#164227"],
  ["#8b3a8b", "#4a1a4a"], ["#a87a1b", "#5c400a"], ["#1b8b7a", "#0a4a42"],
  ["#8b1b2d", "#4a0a14"],
];

function nameToColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h];
}

function getInitials(name) {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

// ─── slot definitions ─────────────────────────────────────────────────────────

const SLOT_DISPLAY = [
  { idx: 0, label: "WINNER",    reward: "+$10",   color: "#D4A017" },
  { idx: 1, label: "2ND PLACE", reward: "+$5",    color: "#B8892A" },
  { idx: 2, label: "3RD PLACE", reward: "+$2.50", color: "#9C7240" },
  { idx: 3, label: "4TH PLACE", reward: "+$1.50", color: "#7E5B38" },
  { idx: 4, label: "5TH PLACE", reward: "+$1",    color: "#604530" },
  { idx: 5, label: "6TH PLACE", reward: "+$0.50", color: "#433027" },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, profile_pic, size = 30 }) {
  const [imgErr, setImgErr] = useState(false);
  const [c0, c1] = nameToColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      background: `linear-gradient(135deg, ${c0}, ${c1})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {profile_pic && !imgErr
        ? <img src={profile_pic} alt={name} onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: Math.round(size * 0.37), fontWeight: 700, color: "#F5EDD0", fontFamily: "'Josefin Sans', sans-serif" }}>{getInitials(name)}</span>
      }
    </div>
  );
}

function Slot({ idx, label, reward, color, player, canPlace, onClick, locked }) {
  const filled = !!player;
  return (
    <div
      onClick={locked ? undefined : onClick}
      role={locked ? undefined : "button"}
      tabIndex={locked ? undefined : 0}
      onKeyDown={locked ? undefined : e => (e.key === "Enter" || e.key === " ") && onClick()}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        borderRadius: 10, minHeight: 50, padding: "6px 10px",
        border: `1px solid ${filled ? `${color}66` : canPlace ? "rgba(196,152,90,0.45)" : "rgba(196,152,90,0.13)"}`,
        background: filled ? `${color}14` : canPlace ? "rgba(196,152,90,0.06)" : "rgba(255,255,255,0.01)",
        cursor: (!locked && (filled || canPlace)) ? "pointer" : "default",
        transition: "all 0.15s ease",
        userSelect: "none",
        outline: "none",
      }}
    >
      {/* Label */}
      <div style={{ width: 76, flexShrink: 0 }}>
        <div style={{
          fontSize: 7.5, letterSpacing: "0.11em", textTransform: "uppercase",
          color, fontFamily: "'Josefin Sans', sans-serif", opacity: 0.9,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, fontFamily: "'Cinzel', serif", marginTop: 1,
          color: "#F2C94C",
        }}>
          {reward}
        </div>
      </div>

      {/* Content */}
      {filled ? (
        <>
          <Avatar name={player.name} profile_pic={player.profile_pic} size={28} />
          <span style={{
            flex: 1, fontSize: 13, fontWeight: 600, color: "#F5EDD0",
            fontFamily: "'Josefin Sans', sans-serif", letterSpacing: "0.03em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {player.name}
          </span>
          {!locked && (
            <span style={{ color: "rgba(245,237,208,0.35)", fontSize: 16, lineHeight: 1, flexShrink: 0, paddingRight: 2 }}>×</span>
          )}
        </>
      ) : (
        <span style={{
          flex: 1, fontSize: 11.5, fontFamily: "'Josefin Sans', sans-serif", letterSpacing: "0.04em",
          color: canPlace ? "rgba(196,152,90,0.6)" : "rgba(245,237,208,0.15)",
        }}>
          {canPlace ? "Tap to place here" : "Empty"}
        </span>
      )}
    </div>
  );
}

function PlayerRow({ player, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick()}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        borderRadius: 10, padding: "8px 12px",
        border: `1px solid ${isSelected ? "rgba(196,152,90,0.6)" : "rgba(196,152,90,0.15)"}`,
        background: isSelected ? "rgba(196,152,90,0.12)" : "rgba(196,152,90,0.04)",
        cursor: "pointer", userSelect: "none",
        transition: "all 0.15s ease",
        outline: "none",
      }}
    >
      <Avatar name={player.name} profile_pic={player.profile_pic} size={28} />
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 600, color: "#F5EDD0",
        fontFamily: "'Josefin Sans', sans-serif", letterSpacing: "0.03em",
      }}>
        {player.name}
      </span>
      {isSelected && (
        <span style={{
          fontSize: 9.5, letterSpacing: "0.1em", color: "rgba(196,152,90,0.8)",
          fontFamily: "'Josefin Sans', sans-serif", flexShrink: 0,
        }}>
          SELECTED
        </span>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function FinaleOrder({ groupId, finaleOrders = {}, onAir, finalists = [] }) {
  const { user, updateUser } = useContext(UserContext);
  const [allPlayers, setAllPlayers]     = useState([]);
  const [slots, setSlots]               = useState(Array(6).fill(null));
  const [unplaced, setUnplaced]         = useState([]);
  const [selected, setSelected]         = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [episodeData, setEpisodeData]   = useState({});

  // Load players and episode once on mount
  useEffect(() => {
    async function load() {
      try {
        const [{ data: players }, { data: ep }] = await Promise.all([
          axios.get("/players/allplayers"),
          axios.get("/episode/getcurrentepisode"),
        ]);
        setEpisodeData(ep);
        setAllPlayers(players);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load players");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Re-apply saved finale order when group switches or data first loads.
  useEffect(() => {
    // Use finalists prop if provided, otherwise all active players
    const pool = finalists.length > 0
      ? allPlayers.filter(p => finalists.includes(p.name))
      : allPlayers.filter(p => p.availability);

    if (!pool.length || !episodeData?.episodeNumber) return;

    setSelected(null);
    const saved = finaleOrders?.[episodeData.episodeNumber];
    if (saved && saved.length >= 6) {
      const find = name => allPlayers.find(p => p.name === name) || null;
      const newSlots = saved.slice(0, 6).map(find);
      setSlots(newSlots);
      const placed = new Set(saved.slice(0, 6));
      setUnplaced(pool.filter(p => !placed.has(p.name)));
    } else {
      setSlots(Array(6).fill(null));
      setUnplaced(pool);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, allPlayers, episodeData, finalists]);

  // When episode ends (onAir true → false), re-fetch episode data for the new week.
  const prevOnAirRef = useRef(onAir);
  useEffect(() => {
    const wasLocked = prevOnAirRef.current;
    prevOnAirRef.current = onAir;
    if (wasLocked && !onAir) {
      axios.get("/episode/getcurrentepisode")
        .then(({ data }) => setEpisodeData(data))
        .catch(() => {});
    }
  }, [onAir]);

  function handleSlotClick(idx) {
    const inSlot = slots[idx];
    if (selected) {
      setSlots(s => { const n = [...s]; n[idx] = selected; return n; });
      setUnplaced(u => {
        const without = u.filter(p => p._id !== selected._id);
        return inSlot ? [...without, inSlot] : without;
      });
      setSelected(null);
    } else if (inSlot) {
      setSlots(s => { const n = [...s]; n[idx] = null; return n; });
      setUnplaced(u => [...u, inSlot]);
    }
  }

  function handlePlayerClick(player) {
    setSelected(prev => prev?._id === player._id ? null : player);
  }

  async function handleSave() {
    const filled = slots.filter(Boolean).length;
    if (filled < 6) {
      toast.error(`Fill all 6 slots first (${6 - filled} empty)`);
      return;
    }
    setIsSubmitting(true);
    try {
      const order = slots.map(p => p.name);
      if (user?.isGuest) {
        updateUser({ finaleOrders: { ...(user.finaleOrders || {}), [episodeData.episodeNumber]: order } });
      } else {
        await axios.put("/transactions/save-boot-order", {
          order, userId: user.id, groupId,
          episodeNumber: episodeData.episodeNumber,
          orderType: "finaleOrders",
        });
      }
      toast.success("Finale picks saved!");
    } catch (err) {
      toast.error("Failed to save picks");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filled = slots.filter(Boolean).length;
  const isLocked = onAir !== undefined ? !!onAir : !!episodeData?.onAir;

  return (
    <div className="rounded-2xl shadow-xl p-4 mb-6" style={{
      background: "linear-gradient(135deg, rgba(15,35,64,0.9) 0%, rgba(11,26,44,0.95) 100%)",
      border: `1px solid ${isLocked ? "rgba(220,50,50,0.35)" : "rgba(212,160,23,0.3)"}`,
    }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl tracking-tight">Finale Picks</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(245,237,208,0.5)" }}>
            {isLocked
              ? "Episode is live — picks are locked"
              : selected
                ? "Now tap a slot to place them"
                : "Rank the finalists from most to least likely to win"
            }
          </p>
        </div>
        {!isLoading && (
          isLocked ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(220,50,50,0.12)", border: "1px solid rgba(220,50,50,0.4)",
              borderRadius: 8, padding: "5px 10px", flexShrink: 0,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "#E63917",
                display: "inline-block", boxShadow: "0 0 6px #E63917",
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#E87060",
                letterSpacing: "0.12em", fontFamily: "'Josefin Sans', sans-serif",
              }}>LIVE</span>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="shrink-0 rounded-lg bg-primary text-black font-semibold px-4 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : `Save (${filled}/6)`}
            </button>
          )
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(196,152,90,0.06)" }} />
          ))}
        </div>
      ) : isLocked ? (
        // ── Locked view: full-width read-only slots ──
        <div className="flex flex-col gap-1.5">
          <p className="text-xs uppercase tracking-widest font-semibold mb-0.5" style={{
            color: "#D4A017", fontFamily: "'Josefin Sans', sans-serif",
          }}>
            Your picks
          </p>
          {SLOT_DISPLAY.map(s => (
            <Slot
              key={s.idx}
              {...s}
              player={slots[s.idx]}
              canPlace={false}
              onClick={() => {}}
              locked
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4">

          {/* ── Players panel — mobile: top, desktop: right ── */}
          <div className="order-1 md:order-2 flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest mb-2" style={{
              color: selected ? "rgba(196,152,90,0.7)" : "rgba(245,237,208,0.35)",
              fontFamily: "'Josefin Sans', sans-serif",
            }}>
              {unplaced.length === 0
                ? "All finalists placed"
                : selected
                  ? `${selected.name} selected — pick a slot`
                  : `${unplaced.length} finalist${unplaced.length !== 1 ? "s" : ""} remaining`
              }
            </p>
            <div className="flex flex-col gap-1.5">
              {unplaced.length === 0
                ? (
                  <p className="text-center py-6 text-sm" style={{ color: "rgba(245,237,208,0.25)" }}>
                    All finalists assigned
                  </p>
                )
                : unplaced.map(p => (
                  <PlayerRow
                    key={p._id}
                    player={p}
                    isSelected={selected?._id === p._id}
                    onClick={() => handlePlayerClick(p)}
                  />
                ))
              }
            </div>
          </div>

          {/* ── Slots panel — mobile: bottom, desktop: left ── */}
          <div className="order-2 md:order-1 flex flex-col gap-1.5 w-full md:w-72 lg:w-80 flex-shrink-0">
            <p className="text-xs uppercase tracking-widest font-semibold mb-0.5" style={{
              color: "#D4A017", fontFamily: "'Josefin Sans', sans-serif",
            }}>
              Most likely to win
            </p>
            {SLOT_DISPLAY.map(s => (
              <Slot
                key={s.idx}
                {...s}
                player={slots[s.idx]}
                canPlace={!!selected}
                onClick={() => handleSlotClick(s.idx)}
              />
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
