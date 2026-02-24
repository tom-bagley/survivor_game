import { useState } from "react";

const LONG_BONUSES = [
  { label: "Individual Win",  rate: "+$2.50",  positive: true },
  { label: "Team Win",        rate: "+$1.50",  positive: true },
  { label: "Reward Win",      rate: "+$0.50",  positive: true },
  { label: "Right Side Vote", rate: "+$0.50",  positive: true },
  { label: "Found Idol or Advantage",                          rate: "+$2.50",  positive: true },
  { label: "Played Idol or Shot in the Dark Correctly",        rate: "+$10.00", positive: true },
];

const FINALIST_BONUSES = [
  { label: "Winner (1st)", rate: "+$25.00" },
  { label: "2nd Place",    rate: "+$5.00"  },
  { label: "3rd Place",    rate: "+$2.50"  },
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

export default function BuyStockDisplay({
  name,
  profilePhotoUrl,
  shares,
  availableShares,
  currentPrice = 1,
  tribalCouncil = false,
  tradingFrozen = false,
  isEliminated = false,
  buyStock,
  sellStock,
}) {
  const [showBonuses, setShowBonuses] = useState(false);

  const soldOut    = availableShares === 0;
  const ownedNone  = shares === 0;
  const frozen     = tribalCouncil || tradingFrozen;

  const buyDisabled   = isEliminated || soldOut || frozen;
  const buy5Disabled  = isEliminated || availableShares < 5 || frozen;
  const sellDisabled  = isEliminated || ownedNone || frozen;
  const sell5Disabled = isEliminated || shares < 5 || frozen;

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
      <div style={{ position: "relative", paddingTop: "110%", background: J.surface }}>
        <img
          src={profilePhotoUrl}
          alt={name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
        />
        {/* Top vignette */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 60,
          background: "linear-gradient(to bottom, rgba(9,20,38,0.6), transparent)",
        }} />
        {/* Bottom vignette */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: `linear-gradient(to top, ${J.bg} 0%, ${J.bg}cc 40%, transparent 100%)`,
        }} />
        {/* Name + summary */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 12px 12px" }}>
          <h4 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 20,
            fontWeight: 700,
            color: J.text,
            letterSpacing: "0.05em",
            textShadow: "0 2px 10px rgba(0,0,0,1)",
            margin: 0,
            lineHeight: 1.15,
          }}>
            {name}
          </h4>
          <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: J.greenBright, letterSpacing: "0.04em" }}>
              ▲ {shares} share{shares !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "12px", background: J.bg }}>

        {/* Big stats trio */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
          {[
            { label: "Owned",    value: shares },
            { label: "Cost Ea",  value: `$${currentPrice}` },
            { label: "In Pool",  value: availableShares },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: J.surface,
              border: `1px solid ${J.surfaceRing}`,
              borderRadius: 10,
              padding: "8px 4px",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 8,
                color: J.textFaint,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 4,
              }}>
                {label}
              </div>
              <div style={{
                fontSize: 18,
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
              Bonus per share
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {LONG_BONUSES.map(({ label, rate, positive }) => (
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

          
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>

          {/* Buy row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            <button
              type="button"
              onClick={() => buyStock(name, 1)}
              disabled={buyDisabled}
              style={{
                padding: "10px",
                borderRadius: 10,
                border: "none",
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.10em",
                cursor: buyDisabled ? "not-allowed" : "pointer",
                transition: "opacity 0.15s, box-shadow 0.15s",
                opacity: buyDisabled ? 0.35 : 1,
                background: `linear-gradient(135deg, #3a9454 0%, #1f5e30 100%)`,
                color: J.text,
                boxShadow: buyDisabled ? "none" : "0 4px 20px rgba(58,148,84,0.45)",
              }}
            >
              {isEliminated ? "ELIMINATED" : tradingFrozen ? "FROZEN" : tribalCouncil ? "TRIBAL" : "▲ BUY 1"}
            </button>
            <button
              type="button"
              onClick={() => buyStock(name, 5)}
              disabled={buy5Disabled}
              style={{
                padding: "10px",
                borderRadius: 10,
                border: "none",
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.10em",
                cursor: buy5Disabled ? "not-allowed" : "pointer",
                transition: "opacity 0.15s, box-shadow 0.15s",
                opacity: buy5Disabled ? 0.35 : 1,
                background: `linear-gradient(135deg, #3a9454 0%, #1f5e30 100%)`,
                color: J.text,
                boxShadow: buy5Disabled ? "none" : "0 4px 20px rgba(58,148,84,0.45)",
              }}
            >
              {isEliminated ? "ELIMINATED" : tradingFrozen ? "FROZEN" : tribalCouncil ? "TRIBAL" : "▲ BUY 5"}
            </button>
          </div>

          {/* Sell row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            <button
              type="button"
              onClick={() => sellStock(name, 1)}
              disabled={sellDisabled}
              style={{
                padding: "8px",
                borderRadius: 10,
                border: `1px solid ${sellDisabled ? J.divider : "rgba(196,152,90,0.25)"}`,
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                cursor: sellDisabled ? "not-allowed" : "pointer",
                transition: "opacity 0.15s, background 0.15s",
                opacity: sellDisabled ? 0.3 : 1,
                background: sellDisabled ? "transparent" : "rgba(196,152,90,0.06)",
                color: J.textDim,
              }}
            >
              {isEliminated ? "ELIMINATED" : tradingFrozen ? "FROZEN" : tribalCouncil ? "TRIBAL" : "SELL 1"}
            </button>
            <button
              type="button"
              onClick={() => sellStock(name, 5)}
              disabled={sell5Disabled}
              style={{
                padding: "8px",
                borderRadius: 10,
                border: `1px solid ${sell5Disabled ? J.divider : "rgba(196,152,90,0.25)"}`,
                fontFamily: "'Josefin Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                cursor: sell5Disabled ? "not-allowed" : "pointer",
                transition: "opacity 0.15s, background 0.15s",
                opacity: sell5Disabled ? 0.3 : 1,
                background: sell5Disabled ? "transparent" : "rgba(196,152,90,0.06)",
                color: J.textDim,
              }}
            >
              {isEliminated ? "ELIMINATED" : tradingFrozen ? "FROZEN" : tribalCouncil ? "TRIBAL" : "SELL 5"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
