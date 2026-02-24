import { useState } from "react";

const PALETTE = [
  ["#c8511b", "#7a2d00"],
  ["#1b6ca8", "#0d3d61"],
  ["#2d7a45", "#164227"],
  ["#8b3a8b", "#4a1a4a"],
  ["#a87a1b", "#5c400a"],
  ["#1b8b7a", "#0a4a42"],
  ["#8b1b2d", "#4a0a14"],
];

function nameToColor(name) {
  let hash = 0;
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash];
}

function getInitials(name) {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

const DANGER_RANK_STYLES = {
  1: { bg: "#E63917", border: "rgba(230,57,23,0.75)",  label: "Most Likely"  },
  2: { bg: "#E63917", border: "rgba(230,57,23,0.75)", label: "Second Most Likely" },
  3: { bg: "#E63917", border: "rgba(230,57,23,0.75)", label: "Third Most Likely"  },
  4: { bg: "#E63917", border: "rgba(230,57,23,0.75)",  label: "Fourth Most Likely" },
};

const SAFE_REVERSE_STYLES = {
  0: { bg: "#2D9E68", border: "rgba(45,158,104,0.75)", label: "SAFEST"      },
  1: { bg: "#27895A", border: "rgba(39,137,90,0.75)",  label: "2ND SAFEST"  },
  2: { bg: "#206E49", border: "rgba(32,110,73,0.75)",  label: "3RD SAFEST"  },
  3: { bg: "#1A5739", border: "rgba(26,87,57,0.75)",   label: "4TH SAFEST"  },
};

const POSITIVE_REWARDS  = [20, 5, 3, 1];
const NEGATIVE_PENALTIES = [40, 10, 6, 2];

function rankBonus(rank, total) {
  const position = rank - 1;
  if (position < POSITIVE_REWARDS.length) return POSITIVE_REWARDS[position];
  const reversePosition = total - rank;
  if (reversePosition < NEGATIVE_PENALTIES.length) return -NEGATIVE_PENALTIES[reversePosition];
  return 0;
}

export default function PlayerCard({ player, rank, totalPlayers, isDragging, isOver, overDirection }) {
  const [imgError, setImgError] = useState(false);
  const [colors] = useState(() => nameToColor(player.name));
  const hasImg = player.profile_pic && !imgError;
  const bonus = rankBonus(rank, totalPlayers);

  const reversePosition = totalPlayers - rank;
  const isDanger = bonus > 0;
  const isSafe   = bonus < 0;
  const rs = isDanger ? DANGER_RANK_STYLES[rank] : isSafe ? SAFE_REVERSE_STYLES[reversePosition] : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 12,
        background: isDragging ? "rgba(232,148,58,0.1)" : "rgba(196,152,90,0.04)",
        border: isDragging
          ? "1.5px solid rgba(232,148,58,0.6)"
          : rs
          ? `1px solid ${rs.border}`
          : "1px solid rgba(196,152,90,0.12)",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        opacity: isDragging ? 0.45 : 1,
        transition: "transform 0.15s ease, opacity 0.15s ease",
        transform: isOver
          ? overDirection === "right" ? "translateY(4px)" : "translateY(-4px)"
          : "translateY(0)",
        overflow: "hidden",
      }}
    >
      {/* Left: rank label */}
      <div
        style={{
          width: 90,
          flexShrink: 0,
          padding: "14px 10px",
          textAlign: "center",
          borderRight: "1px solid rgba(196,152,90,0.12)",
          background: rs ? `${rs.bg}12` : "transparent",
        }}
      >
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "'Cinzel', serif",
          color: rs ? rs.bg : "rgba(245,237,208,0.2)",
          lineHeight: 1,
        }}>
          #{rank}
        </div>
        {rs && (
          <div style={{
            fontSize: 7,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: rs.bg,
            opacity: 0.75,
            marginTop: 3,
            fontFamily: "'Josefin Sans', sans-serif",
          }}>
            {rs.label}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        marginLeft: 14,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {hasImg ? (
          <img
            src={player.profile_pic}
            alt={player.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#F5EDD0", fontFamily: "'Josefin Sans', sans-serif" }}>
            {getInitials(player.name)}
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{ flex: 1, padding: "0 12px", minWidth: 0 }}>
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          fontFamily: "'Josefin Sans', sans-serif",
          color: "#F5EDD0",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "block",
        }}>
          {player.name}
        </span>
      </div>

      {/* Bonus */}
      <div style={{ flexShrink: 0, paddingRight: 10 }}>
        {bonus > 0 ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#F2C94C", fontFamily: "'Cinzel', serif" }}>
            +${bonus}
          </span>
        ) : bonus < 0 ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#E8943A", fontFamily: "'Cinzel', serif" }}>
            −${Math.abs(bonus)}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "rgba(245,237,208,0.15)", fontFamily: "'Cinzel', serif" }}>—</span>
        )}
      </div>

      {/* Drag handle */}
      <div style={{
        flexShrink: 0,
        padding: "0 14px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        opacity: 0.25,
      }}>
        {[0, 1].map(i => (
          <div key={i} style={{ display: "flex", gap: 3 }}>
            {[0, 1].map(j => (
              <div key={j} style={{ width: 3, height: 3, borderRadius: "50%", background: "#C4985A" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
