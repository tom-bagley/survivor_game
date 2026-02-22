import { useState } from "react";

const LONG_BONUSES = [
  { label: "Challenge Win",   rate: "+$0.10", positive: true  },
  { label: "Right Side Vote", rate: "+$0.08", positive: true  },
  { label: "Found Idol",      rate: "+$0.50", positive: true  },
  { label: "Played Idol",     rate: "+$2.00", positive: true  },
  { label: "Lost Challenge",  rate: "−$0.10", positive: false },
  { label: "Wrong Side Vote", rate: "−$0.08", positive: false },
];

const FINALIST_BONUSES = [
  { label: "Winner (1st)",  rate: "+$5.00" },
  { label: "2nd Place",     rate: "+$1.00" },
  { label: "3rd Place",     rate: "+$0.50" },
];

const SHORT_BONUSES = [
  { label: "Voted Out",       rate: "+$1.00", positive: true  },
  { label: "Lost Challenge",  rate: "+$0.10", positive: true  },
  { label: "Wrong Side Vote", rate: "+$0.08", positive: true  },
  { label: "Challenge Win",   rate: "−$0.10", positive: false },
  { label: "Right Side Vote", rate: "−$0.08", positive: false },
];

// Island / survivor palette
const J = {
  bg:          "#0B1A2C",
  card:        "#0F2340",
  ring:        "rgba(196,152,90,0.3)",
  surface:     "#162B44",
  surfaceRing: "rgba(196,152,90,0.18)",
  green:       "#2D6A4F",
  greenBright: "#2D9E68",
  gold:        "#F2C94C",
  coral:       "#E8943A",
  text:        "#F5EDD0",
  textDim:     "rgba(245,237,208,0.5)",
  textFaint:   "rgba(245,237,208,0.22)",
  divider:     "rgba(196,152,90,0.18)",
};

export default function Display({
  name,
  profilePhotoUrl,
  shares,
  availableShares,
  shorts = 0,
  availableShorts = 0,
  currentPrice = 1,
  isOnAir = false,
  tribalCouncil = false,
  liveBonusBalance = null,
  isEliminated = false,
  buyStock,
  sellStock,
  shortStock,
  coverShort,
}) {
  const [tab, setTab] = useState("long");
  const [showBonuses, setShowBonuses] = useState(false);
  const isLong = tab === "long";

  const soldOut       = availableShares === 0;
  const shortsPoolFull = availableShorts === 0;

  const owned     = isLong ? shares        : shorts;
  const pool      = isLong ? availableShares : availableShorts;
  const poolEmpty = isLong ? soldOut        : shortsPoolFull;
  const ownedNone = owned === 0;

  // Tribal council: all trading locked
  // During on-air (non-tribal), buying/shorting is only allowed with bonus balance
  const notEnoughBonus = !tribalCouncil && isOnAir && liveBonusBalance !== null && liveBonusBalance < currentPrice;
  const buyDisabled = isEliminated || poolEmpty || tribalCouncil || notEnoughBonus;
  const sellDisabled = isEliminated || ownedNone || isOnAir;

  return (
    <div style={{
      borderRadius: 20,
      background: J.bg,
      boxShadow: `0 6px 40px rgba(0,0,0,0.7), 0 0 0 1px ${J.ring}`,
      overflow: "hidden",
      fontFamily: "'Josefin Sans', sans-serif",
      filter: isEliminated ? "grayscale(1) brightness(0.65)" : "none",
      pointerEvents: isEliminated ? "none" : "auto",
    }}>

      {/* ── Hero photo with name overlay ── */}
      <div style={{ position: "relative", paddingTop: "100%", background: J.surface }}>
        <img
          src={profilePhotoUrl}
          alt={name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
        {/* Top vignette */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(to bottom, rgba(9,20,38,0.6), transparent)",
        }} />
        {/* Bottom vignette */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: `linear-gradient(to top, ${J.bg} 0%, ${J.bg}cc 40%, transparent 100%)`,
        }} />
        {/* Name + summary */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 16px" }}>
          <h4 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 26,
            fontWeight: 700,
            color: J.text,
            letterSpacing: "0.05em",
            textShadow: "0 2px 10px rgba(0,0,0,1)",
            margin: 0,
            lineHeight: 1.15,
          }}>
            {name}
          </h4>
          <div style={{ display: "flex", gap: 14, marginTop: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: J.greenBright, letterSpacing: "0.04em" }}>
              ▲ {shares} long
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: J.coral, letterSpacing: "0.04em" }}>
              ▼ {shorts} short
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        borderBottom: `1px solid ${J.divider}`,
        background: J.card,
      }}>
        {[
          { key: "long",  label: "LONG POSITION",  activeColor: J.greenBright },
          { key: "short", label: "SHORT POSITION", activeColor: J.coral },
        ].map(({ key, label, activeColor }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "11px 0 9px",
              background: tab === key ? "rgba(196,152,90,0.1)" : "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === key ? activeColor : "transparent"}`,
              color: tab === key ? activeColor : J.textFaint,
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "16px", background: J.bg }}>

        {/* Big stats trio */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Owned",    value: owned },
            { label: "Cost Ea",  value: `$${currentPrice}` },
            { label: "In Pool",  value: pool  },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: J.surface,
              border: `1px solid ${J.surfaceRing}`,
              borderRadius: 12,
              padding: "12px 6px",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 9,
                color: J.textFaint,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 5,
              }}>
                {label}
              </div>
              <div style={{
                fontSize: 22,
                fontWeight: 800,
                fontFamily: "'Cinzel', serif",
                color: J.text,
                lineHeight: 1,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Bonus toggle */}
        <button
          type="button"
          onClick={() => setShowBonuses(v => !v)}
          style={{
            width: "100%",
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 9,
            border: `1px solid ${J.surfaceRing}`,
            background: showBonuses ? "rgba(196,152,90,0.1)" : "transparent",
            color: showBonuses ? J.gold : J.textFaint,
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 8 }}>{showBonuses ? "▲" : "▼"}</span>
          {showBonuses ? "Hide" : "Show"} bonus structure
        </button>

        {/* Rules card — collapsible */}
        {showBonuses && (
          <div style={{
            background: J.surface,
            border: `1px solid ${J.surfaceRing}`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 14,
          }}>
            <p style={{
              fontSize: 9,
              color: J.textFaint,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              margin: "0 0 12px",
            }}>
              {isLong ? "Bonus per share" : "Payout per short"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(isLong ? LONG_BONUSES : SHORT_BONUSES).map(({ label, rate, positive }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: J.textDim }}>{label}</span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Cinzel', serif",
                    color: positive ? J.gold : J.coral,
                    letterSpacing: "0.02em",
                  }}>
                    {rate}
                  </span>
                </div>
              ))}
            </div>

            {isLong && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${J.divider}` }}>
                <p style={{
                  fontSize: 9,
                  color: J.textFaint,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  margin: "0 0 10px",
                }}>
                  Season finale (one-time)
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {FINALIST_BONUSES.map(({ label, rate }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: J.textDim }}>{label}</span>
                      <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'Cinzel', serif",
                        color: J.gold,
                        letterSpacing: "0.02em",
                      }}>
                        {rate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {owned > 0 && (
              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${J.divider}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: 11, color: J.textFaint }}>
                  {isLong ? `Best episode · ${owned} share${owned !== 1 ? "s" : ""}` : `If voted out · ${owned} short${owned !== 1 ? "s" : ""}`}
                </span>
                <span style={{
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: "'Cinzel', serif",
                  color: J.gold,
                }}>
                  {isLong ? `+$${(owned * 2).toFixed(2)}` : `+$${(owned * 1).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>

          {/* Primary — Buy / Short */}
          <button
            type="button"
            onClick={() => isLong ? buyStock(name, 1) : shortStock(name, 1)}
            disabled={buyDisabled}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 11,
              border: "none",
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.12em",
              cursor: buyDisabled ? "not-allowed" : "pointer",
              transition: "opacity 0.15s, box-shadow 0.15s",
              opacity: buyDisabled ? 0.35 : 1,
              background: isLong
                ? `linear-gradient(135deg, #3a9454 0%, #1f5e30 100%)`
                : `linear-gradient(135deg, #a83520 0%, #6b1e0d 100%)`,
              color: J.text,
              boxShadow: buyDisabled ? "none" : isLong
                ? "0 4px 20px rgba(58,148,84,0.45)"
                : "0 4px 20px rgba(175,50,28,0.45)",
            }}
          >
            {isEliminated
              ? `${isLong ? "BUY" : "SHORT"} · ELIMINATED`
              : tribalCouncil
                ? `${isLong ? "BUY" : "SHORT"} · TRIBAL`
                : notEnoughBonus
                  ? `${isLong ? "BUY" : "SHORT"} · NO BONUS`
                  : isLong ? "▲  BUY 1 SHARE" : "▼  SHORT 1"}
          </button>

          {/* Secondary — Sell / Cover */}
          <button
            type="button"
            onClick={() => isLong ? sellStock(name, 1) : coverShort(name, 1)}
            disabled={sellDisabled}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 11,
              border: `1px solid ${sellDisabled ? J.divider : "rgba(196,152,90,0.25)"}`,
              fontFamily: "'Josefin Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              cursor: sellDisabled ? "not-allowed" : "pointer",
              transition: "opacity 0.15s, background 0.15s",
              opacity: sellDisabled ? 0.3 : 1,
              background: sellDisabled ? "transparent" : "rgba(196,152,90,0.06)",
              color: J.textDim,
            }}
          >
            {isEliminated
              ? `${isLong ? "SELL" : "COVER"} · ELIMINATED`
              : isOnAir
                ? `${isLong ? "SELL" : "COVER"} · LOCKED`
                : isLong ? "SELL 1 SHARE" : "COVER 1 SHORT"}
          </button>

        </div>
      </div>
    </div>
  );
}
