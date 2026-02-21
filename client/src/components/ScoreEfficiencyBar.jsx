import { useState } from "react";

const J = {
  surface:    "#162B44",
  surfaceDeep:"#0F2340",
  border:     "rgba(196,152,90,0.22)",
  borderDim:  "rgba(196,152,90,0.12)",
  text:       "#F5EDD0",
  textDim:    "rgba(245,237,208,0.5)",
  textFaint:  "rgba(245,237,208,0.25)",
  gold:       "#F2C94C",
  coral:      "#E8943A",
  green:      "#2D9E68",
};

function fmt(n) {
  return Number(n).toFixed(2);
}

function StoryLog({ log }) {
  return (
    <div style={{ marginTop: 14, fontSize: 12, color: J.textDim, lineHeight: 1.6 }}>

      {/* Starting budget */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: `1px solid ${J.borderDim}`, marginBottom: 10 }}>
        <span style={{ color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 10 }}>Starting budget</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: J.text }}>${fmt(log.startBudget)}</span>
      </div>

      {/* Boot order */}
      {log.bootOrderBonus > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 10 }}>Boot order (perfect)</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: J.gold }}>+${fmt(log.bootOrderBonus)}</span>
          </div>
          {(log.votedOut || []).map(({ survivor, bonus }) => (
            <div key={survivor} style={{ display: "flex", justifyContent: "space-between", paddingLeft: 10, color: J.textFaint, fontSize: 11 }}>
              <span>· {survivor} voted out</span>
              <span style={{ color: J.gold }}>+${fmt(bonus)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stock allocations */}
      {log.stockAllocations?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 10 }}>Stock picks</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: J.gold }}>+${fmt(log.totalStockBonus)}</span>
          </div>
          {log.stockAllocations.map((a) => (
            <div key={a.survivor} style={{ marginBottom: 7, paddingLeft: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: J.text, fontWeight: 600 }}>{a.survivor}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: J.gold }}>+${fmt(a.totalBonus)}</span>
              </div>
              <div style={{ color: J.textFaint, fontSize: 11 }}>
                {a.shares} shares @ ${fmt(a.pricePerShare)} · {a.events.join(", ")} · +${fmt(a.bonusPerShare)}/share
              </div>
            </div>
          ))}
        </div>
      )}

      {log.stockAllocations?.length === 0 && log.bootOrderBonus === 0 && (
        <div style={{ color: J.textFaint, fontSize: 11, marginBottom: 10 }}>No positive bonuses were available this episode.</div>
      )}

      {/* End budget */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${J.borderDim}` }}>
        <span style={{ color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 10 }}>Max achievable</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, color: J.green }}>${fmt(log.endBudget)}</span>
      </div>
    </div>
  );
}

export default function ScoreEfficiencyBar({ netWorth, maxPossibleBudget, maxPossibleLog }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.min(100, Math.max(0, (netWorth / maxPossibleBudget) * 100));

  const barColor =
    pct >= 80 ? J.green :
    pct >= 50 ? J.gold  :
                J.coral;

  return (
    <div style={{
      marginTop: 8,
      borderRadius: 14,
      background: J.surface,
      border: `1px solid ${J.border}`,
      padding: "14px 20px",
    }}>
      {/* Bar header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.16em" }}>
          Score Efficiency
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Cinzel', serif", color: barColor }}>
          {pct.toFixed(1)}%{" "}
          <span style={{ fontSize: 11, fontWeight: 400, color: J.textFaint }}>
            of max (${maxPossibleBudget.toFixed(0)})
          </span>
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", height: 8, borderRadius: 99, background: "rgba(196,152,90,0.12)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          borderRadius: 99,
          width: `${pct}%`,
          background: barColor,
          boxShadow: `0 0 10px ${barColor}88`,
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Expand toggle */}
      {maxPossibleLog && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            marginTop: 10,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: 11,
            color: J.textFaint,
            fontFamily: "'Josefin Sans', sans-serif",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 9 }}>{expanded ? "▲" : "▼"}</span>
          {expanded ? "Hide" : "Show"} max score story
        </button>
      )}

      {/* Story log */}
      {expanded && maxPossibleLog && <StoryLog log={maxPossibleLog} />}
    </div>
  );
}
