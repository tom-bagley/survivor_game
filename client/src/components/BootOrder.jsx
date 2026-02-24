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
// Slots array (save order): [0]=FIRST OUT … [3]=FOURTH OUT, [4]=4TH SAFEST … [7]=SAFEST
// Display: danger 0-3 top-to-bottom, safe shown safest-first (7,6,5,4)

const SLOT_DISPLAY = [
  { idx: 0, label: "Most Likely",   reward: "+$40",  color: "#E63917", isDanger: true },
  { idx: 1, label: "Second Most Likely",  reward: "+$10",  color: "#C7321A", isDanger: true },
  { idx: 2, label: "Third Most Likely",   reward: "+$6",   color: "#B02D17", isDanger: true },
  { idx: 3, label: "Fourth Most Likely",  reward: "+$2",   color: "#992714", isDanger: true },
  { idx: 4, label: "Fifth Most Likely",   reward: "+$1",   color: "#7A2010", isDanger: true },
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

function Slot({ idx, label, reward, color, isDanger, player, canPlace, onClick, locked }) {
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
          color: isDanger ? "#F2C94C" : "#6FCF97",
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

function PlayerDropdown({ unplaced, selected, onSelect }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={selected?._id || ""}
        onChange={e => {
          const player = unplaced.find(p => p._id === e.target.value);
          onSelect(player || null);
        }}
        style={{
          width: "100%",
          background: selected ? "rgba(196,152,90,0.1)" : "rgba(196,152,90,0.04)",
          border: `1px solid ${selected ? "rgba(196,152,90,0.6)" : "rgba(196,152,90,0.25)"}`,
          borderRadius: 10,
          color: selected ? "#F5EDD0" : "rgba(245,237,208,0.45)",
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: 13,
          fontWeight: selected ? 600 : 400,
          padding: "10px 36px 10px 12px",
          cursor: "pointer",
          outline: "none",
          appearance: "none",
          WebkitAppearance: "none",
          transition: "all 0.15s ease",
        }}
      >
        <option value="" style={{ background: "#0d2340", color: "rgba(245,237,208,0.5)" }}>
          — Select a castaway —
        </option>
        {unplaced.map(p => (
          <option key={p._id} value={p._id} style={{ background: "#0d2340", color: "#F5EDD0", fontWeight: 600 }}>
            {p.name}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: "rgba(196,152,90,0.6)", fontSize: 11,
      }}>
        ▾
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function BootOrder({ groupId, bootOrders = {}, onAir }) {
  const { user, updateUser } = useContext(UserContext);
  const [allPlayers, setAllPlayers]     = useState([]);
  const [slots, setSlots]               = useState(Array(5).fill(null));
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

  // Re-apply saved boot order when group switches or when data first loads.
  // groupId and bootOrders always update together (batched in switchGroup),
  // so groupId changing is a reliable signal that bootOrders is also fresh.
  useEffect(() => {
    const activePlayers = allPlayers.filter(p => p.availability);
    if (!activePlayers.length || episodeData?.episodeNumber == null) return;

    setSelected(null);
    const saved = bootOrders?.[episodeData.episodeNumber];
    if (saved && saved.length >= 5) {
      const find = name => allPlayers.find(p => p.name === name) || null;
      const newSlots = saved.slice(0, 5).map(find);
      setSlots(newSlots);
      const placed = new Set(saved.slice(0, 5));
      setUnplaced(activePlayers.filter(p => !placed.has(p.name)));
    } else {
      setSlots(Array(5).fill(null));
      setUnplaced(activePlayers);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, allPlayers, episodeData]);

  // When the episode ends (onAir true → false), re-fetch episode data so the
  // new episode number is picked up and slots reset to empty for the new week.
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
      // Place selected player; if slot occupied, return that player to list
      setSlots(s => { const n = [...s]; n[idx] = selected; return n; });
      setUnplaced(u => {
        const without = u.filter(p => p._id !== selected._id);
        return inSlot ? [...without, inSlot] : without;
      });
      setSelected(null);
    } else if (inSlot) {
      // Remove from slot → back to unplaced list
      setSlots(s => { const n = [...s]; n[idx] = null; return n; });
      setUnplaced(u => [...u, inSlot]);
    }
  }

  async function handleSave() {
    const filled = slots.filter(Boolean).length;
    if (filled < 5) {
      toast.error(`Fill all 5 slots first (${5 - filled} empty)`);
      return;
    }
    setIsSubmitting(true);
    try {
      const order = slots.map(p => p.name);
      if (user?.isGuest) {
        updateUser({ bootOrders: { ...(user.bootOrders || {}), [episodeData.episodeNumber]: order } });
      } else {
        await axios.put("/transactions/save-boot-order", {
          order, userId: user.id, groupId, episodeNumber: episodeData.episodeNumber,
        });
      }
      toast.success("Elimination picks saved!");
    } catch (err) {
      toast.error("Failed to save order");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filled = slots.filter(Boolean).length;
  const isLocked = onAir !== undefined ? !!onAir : !!episodeData?.onAir;

  return (
    <div className="rounded-2xl shadow-xl p-4 mb-6" style={{
      background: "linear-gradient(135deg, rgba(15,35,64,0.9) 0%, rgba(11,26,44,0.95) 100%)",
      border: `1px solid ${isLocked ? "rgba(220,50,50,0.35)" : "rgba(196,152,90,0.2)"}`,
    }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl tracking-tight">Elimination Picks</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(245,237,208,0.5)" }}>
            {isLocked
              ? "Episode is live — picks are locked"
              : selected
                ? "Now tap a slot to place them"
                : "Select a castaway from the dropdown you think is going home, then tap a slot and earn money if you are right"
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
              {isSubmitting ? "Saving…" : `Save (${filled}/5)`}
            </button>
          )
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(196,152,90,0.06)" }} />
          ))}
        </div>
      ) : isLocked ? (
        // ── Locked view: full-width read-only slots ──
        <div className="flex flex-col gap-1.5">
          <p className="text-xs uppercase tracking-widest font-semibold mb-0.5" style={{
            color: "#E87060", fontFamily: "'Josefin Sans', sans-serif",
          }}>
            Most likely to go home
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
        <div className="flex flex-col gap-3">

          {/* ── Players dropdown ── */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-1.5" style={{
              color: selected ? "rgba(196,152,90,0.7)" : "rgba(245,237,208,0.35)",
              fontFamily: "'Josefin Sans', sans-serif",
            }}>
              {unplaced.length === 0
                ? "All castaways placed"
                : selected
                  ? `${selected.name} selected — tap a slot below`
                  : `${unplaced.length} castaway${unplaced.length !== 1 ? "s" : ""} remaining`
              }
            </p>
            {unplaced.length === 0 ? (
              <p className="text-center py-3 text-sm" style={{ color: "rgba(245,237,208,0.25)" }}>
                All castaways assigned
              </p>
            ) : (
              <PlayerDropdown
                unplaced={unplaced}
                selected={selected}
                onSelect={setSelected}
              />
            )}
          </div>

          {/* ── Slots ── */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs uppercase tracking-widest font-semibold" style={{
              color: "#E87060", fontFamily: "'Josefin Sans', sans-serif",
            }}>
              Most likely to go home
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
