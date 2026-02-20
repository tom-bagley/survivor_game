import { useState } from "react";

// Deterministic accent color per player (maps to app palette tones)
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

// Rank badges use the site's color tokens: red-flame → primary orange → accent yellow
const RANK_STYLES = {
  1: { bg: "#E63917", border: "rgba(230,57,23,0.75)",  text: "#fff",    label: "FIRST OUT"  },
  2: { bg: "#F15A24", border: "rgba(241,90,36,0.75)",  text: "#fff",    label: "SECOND OUT" },
  3: { bg: "#FFC83D", border: "rgba(255,200,61,0.75)", text: "#1a1000", label: "THIRD OUT"  },
};

// Bonus = max(100 - (rank-1)*20, 0)  — matches server addBonuses logic
function rankBonus(rank) {
  return Math.max(100 - (rank - 1) * 20, 0);
}

export default function PlayerCard({ player, rank, isDragging, isOver, overDirection }) {
  const [imgError, setImgError] = useState(false);
  const [colors] = useState(() => nameToColor(player.name));
  const hasImg = player.profile_pic && !imgError;
  const rs = RANK_STYLES[rank];

  return (
    <div
      style={{
        width: 128,
        height: 208,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        flexShrink: 0,
        transition: isDragging ? "none" : "transform 0.18s ease, box-shadow 0.18s ease",
        transform: isDragging
          ? "scale(1.08) rotate(2deg)"
          : isOver
          ? overDirection === "left" ? "translateX(10px)" : "translateX(-10px)"
          : "scale(1) rotate(0deg)",
        boxShadow: isDragging
          ? "0 24px 60px rgba(0,0,0,0.85), 0 0 24px rgba(241,90,36,0.35)"
          : "0 8px 28px rgba(0,0,0,0.6)",
        opacity: isDragging ? 0.92 : 1,
        border: isDragging
          ? "1.5px solid rgba(241,90,36,0.8)"
          : rank <= 3
          ? `1.5px solid ${rs.border}`
          : "1px solid rgba(255,255,255,0.1)",
        zIndex: isDragging ? 100 : 1,
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hasImg ? "transparent" : `linear-gradient(175deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
          zIndex: 0,
        }}
      />
      {hasImg && (
        <img
          src={player.profile_pic}
          alt={player.name}
          onError={() => setImgError(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        />
      )}

      {/* Initials watermark (no-photo fallback) */}
      {!hasImg && (
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -60%)",
            fontSize: 52,
            fontWeight: 900,
            fontFamily: "Oswald, sans-serif",
            color: "rgba(255,255,255,0.12)",
            letterSpacing: "0.04em",
            zIndex: 1,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {getInitials(player.name)}
        </div>
      )}

      {/* Top vignette */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 70,
          background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 100%)",
          zIndex: 2,
        }}
      />

      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 90,
          background: "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
          zIndex: 2,
        }}
      />

      {/* Rank badge */}
      <div
        style={{
          position: "absolute",
          top: 10, left: 10,
          zIndex: 3,
          width: 28, height: 28,
          borderRadius: "50%",
          background: rs ? rs.bg : "rgba(255,255,255,0.1)",
          border: rs ? `1.5px solid ${rs.border}` : "1px solid rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          fontFamily: "Oswald, sans-serif",
          color: rs ? rs.text : "rgba(255,255,255,0.7)",
          boxShadow: rs ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {rank}
      </div>

      {/* Name + label */}
      <div style={{ position: "relative", zIndex: 3, width: "100%", padding: "0 10px 12px", textAlign: "center" }}>
        {rs && (
          <div
            style={{
              fontSize: 7,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: rs.bg,
              fontFamily: "Oswald, sans-serif",
              marginBottom: 3,
              opacity: 0.9,
            }}
          >
            {rs.label}
          </div>
        )}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "Oswald, sans-serif",
            color: "#ffffff",
            lineHeight: 1.25,
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            wordBreak: "break-word",
            letterSpacing: "0.04em",
          }}
        >
          {player.name}
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 11,
            fontFamily: "Oswald, sans-serif",
            letterSpacing: "0.06em",
            color: rankBonus(rank) > 0 ? "#FFC83D" : "rgba(255,255,255,0.25)",
            fontWeight: 600,
          }}
        >
          {rankBonus(rank) > 0 ? `+$${rankBonus(rank)} if out` : "no bonus"}
        </div>
      </div>
    </div>
  );
}
