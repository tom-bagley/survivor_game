import {useState} from "react"

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

const RANK_STYLES = {
  1: { badge: "linear-gradient(135deg, #c0392b, #7b241c)", text: "#ffe0e0", label: "FIRST OUT" },
  2: { badge: "linear-gradient(135deg, #e67e22, #7d4e0f)", text: "#fff0e0", label: "SECOND OUT" },
  3: { badge: "linear-gradient(135deg, #f1c40f, #9a7d0a)", text: "#1a1200", label: "THIRD OUT" },
};

export default function PlayerCard({ player, rank, isDragging, isOver, overDirection}) {
  const [imgError, setImgError] = useState(false);
  const [colors] = useState(() => nameToColor(player.name));
  const hasImg = player.profile_pic && !imgError;
  const rs = RANK_STYLES[rank];

  return (
    <div
      style={{
        width: 130,
        height: 210,
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        flexShrink: 0,
        transition: isDragging ? "none" : "transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease",
        transform: isDragging
          ? "scale(1.08) rotate(2deg)"
          : isOver
          ? overDirection === "left"
            ? "translateX(10px)"
            : "translateX(-10px)"
          : "scale(1) rotate(0deg)",
        boxShadow: isDragging
          ? "0 24px 60px rgba(0,0,0,0.85), 0 0 30px rgba(200,140,40,0.5)"
          : "0 8px 28px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4)",
        opacity: player.availability ? (isDragging ? 0.92 : 1) : 0.55,
        border: isDragging
          ? "1.5px solid rgba(255,210,80,0.8)"
          : rank <= 3
          ? "1.5px solid rgba(255,210,80,0.35)"
          : "1px solid rgba(255,200,80,0.12)",
        zIndex: isDragging ? 100 : 1,
      }}
    >
      {/* Background fill */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hasImg
            ? "transparent"
            : `linear-gradient(175deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
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

      {/* Initials watermark */}
      {!hasImg && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            fontSize: 56,
            fontWeight: 900,
            fontFamily: "'Cinzel', serif",
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

      {/* Top gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 70,
          background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)",
          zIndex: 2,
        }}
      />

      {/* Bottom gradient overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          background: "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
          zIndex: 2,
        }}
      />

      {/* Rank badge */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 3,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: rs ? rs.badge : "rgba(255,220,100,0.15)",
          border: rs ? "1.5px solid rgba(255,240,160,0.7)" : "1px solid rgba(255,200,80,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          fontFamily: "'Cinzel', serif",
          color: rs ? rs.text : "rgba(255,220,100,0.7)",
          boxShadow: rs ? "0 2px 10px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {rank}
      </div>

      {/* Taken pill */}
      {!player.availability && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 8,
            zIndex: 3,
            fontSize: 8,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: "rgba(180,30,30,0.75)",
            border: "1px solid rgba(220,60,60,0.6)",
            borderRadius: 6,
            padding: "2px 6px",
            color: "#ffaaaa",
            fontFamily: "'Cinzel', serif",
          }}
        >
          Taken
        </div>
      )}

      {/* Name + price */}
      <div style={{ position: "relative", zIndex: 3, width: "100%", padding: "0 10px 12px", textAlign: "center" }}>
        {rs && (
          <div
            style={{
              fontSize: 7.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,210,80,0.7)",
              fontFamily: "'Cinzel', serif",
              marginBottom: 3,
            }}
          >
            {rs.label}
          </div>
        )}
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            fontFamily: "'Cinzel', serif",
            color: "#ffe8a0",
            lineHeight: 1.25,
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            wordBreak: "break-word",
            letterSpacing: "0.03em",
          }}
        >
          {player.name}
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 10,
            color: "rgba(255,220,120,0.55)",
            fontFamily: "'Crimson Text', serif",
            letterSpacing: "0.06em",
          }}
        >
          ${player.price} &nbsp;·&nbsp; {player.count} left
        </div>
      </div>
    </div>
  );
}