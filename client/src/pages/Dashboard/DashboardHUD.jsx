import { Link } from "react-router-dom";
import { J } from "./colors";

const NAVBAR_H = 56;
const HUD_H    = 40;

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function DashboardHUD({
  scrollY,
  seasonData,
  episodeData,
  financialData,
  user,
  userGroups,
  groupId,
  onSwitchGroup,
  appliedSort,
  isSortStale,
  onSort,
  groupMembers,
  incomingTrades,
  onShowTradeModal,
  leaderboard,
}) {
  const weekLabel  = Number(seasonData.currentWeek) === 0 ? "Preseason" : `Week ${seasonData.currentWeek}`;
  const rankValue  = leaderboard && typeof leaderboard === "object" ? leaderboard.rank : leaderboard;
  const budgetDisplay = episodeData.onAir && financialData.user.liveBonusBalance != null
    ? fmt.format(financialData.user.liveBonusBalance)
    : fmt.format(financialData.user.budget);

  return (
    <div
      style={{
        position: "fixed",
        top: Math.max(NAVBAR_H - scrollY, 0),
        left: 0, right: 0,
        height: HUD_H,
        zIndex: 35,
        background: "rgba(9,20,38,0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${J.divider}`,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="mx-auto max-w-[1400px]" style={{ width: "100%", padding: "0 16px", display: "flex", alignItems: "center" }}>

        {/* Left: Season / week / live */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, paddingRight: 12 }}>
          <span style={{ fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: "0.18em", textTransform: "uppercase", color: J.textFaint }}>
            {seasonData.seasonName && `${seasonData.seasonName} · `}{weekLabel}
          </span>
          {episodeData.onAir && (
            <span style={{
              fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: "0.16em",
              textTransform: "uppercase", fontWeight: 700,
              color: "#ff4444", display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "#ff4444",
                boxShadow: "0 0 6px #ff4444",
                animation: "livePulse 1.4s ease-in-out infinite",
                display: "inline-block",
              }} />
              Live
            </span>
          )}
        </div>

        <div style={{ width: 1, height: 16, background: J.divider, flexShrink: 0 }} />

        {/* Center: Controls */}
        <div className="hud-controls" style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, overflowX: "auto", minWidth: 0, padding: "0 12px" }}>

          {/* Group switcher */}
          {!user?.isGuest && userGroups.length > 1 && (
            <>
              <span style={{ fontSize: 10, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em", flexShrink: 0 }}>Group:</span>
              {userGroups.map(g => {
                const isActive = String(g._id) === String(groupId);
                return (
                  <button key={g._id} type="button" onClick={() => onSwitchGroup(String(g._id))} style={{
                    padding: "4px 11px", borderRadius: 8, flexShrink: 0,
                    border: `1px solid ${isActive ? "rgba(58,140,82,0.4)" : J.surfaceRing}`,
                    background: isActive ? "rgba(58,140,82,0.15)" : "transparent",
                    color: isActive ? J.greenBright : J.textDim,
                    fontSize: 12, fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    {g.displayName}
                  </button>
                );
              })}
              <div style={{ width: 1, height: 16, background: J.divider, margin: "0 2px", flexShrink: 0 }} />
            </>
          )}

          {/* Sort */}
          <span style={{ fontSize: 10, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em", flexShrink: 0 }}>Sort:</span>
          {[{ mode: "name", label: "A → Z" }, { mode: "stock", label: "Most Owned" }].map(({ mode, label }) => {
            const active = mode === "stock" ? appliedSort === "stock" && !isSortStale : appliedSort === "name";
            return (
              <button key={mode} type="button" onClick={() => onSort(mode)} style={{
                padding: "4px 11px", borderRadius: 8, fontSize: 12, fontWeight: active ? 600 : 400, flexShrink: 0,
                border: `1px solid ${active ? "rgba(212,168,67,0.45)" : J.surfaceRing}`,
                background: active ? "rgba(212,168,67,0.1)" : "transparent",
                color: active ? J.gold : J.textDim, cursor: "pointer", transition: "all 0.15s",
              }}>
                {label}
              </button>
            );
          })}

          {/* Trade */}
          {!user?.isGuest && groupMembers.length > 0 && (
            <>
              <div style={{ width: 1, height: 16, background: J.divider, margin: "0 2px", flexShrink: 0 }} />
              <button type="button" onClick={onShowTradeModal} style={{
                padding: "4px 11px", borderRadius: 8, flexShrink: 0,
                background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)",
                color: J.gold, fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
              }}>
                🤝 Trades
                {incomingTrades.length > 0 && (
                  <span style={{
                    background: J.coral, color: "#fff", borderRadius: "50%",
                    fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                  }}>{incomingTrades.length}</span>
                )}
              </button>
            </>
          )}

          {/* Guest links */}
          {(!user || user.isGuest) && (
            <>
              <div style={{ width: 1, height: 16, background: J.divider, margin: "0 2px", flexShrink: 0 }} />
              <Link to="/register" style={{
                padding: "4px 14px", borderRadius: 8, background: J.green, color: J.text,
                fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: "'Cinzel', serif", flexShrink: 0,
              }}>Sign Up</Link>
              <Link to="/login" style={{
                padding: "4px 14px", borderRadius: 8, background: "transparent",
                border: `1px solid ${J.surfaceRing}`, color: J.textDim,
                fontWeight: 600, fontSize: 12, textDecoration: "none", flexShrink: 0,
              }}>Log In</Link>
            </>
          )}
        </div>

        <div style={{ width: 1, height: 16, background: J.divider, flexShrink: 0 }} />

        {/* Right: Stats */}
        {Number(seasonData.currentWeek) > 0 ? (
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0, paddingLeft: 12 }}>
            {[
              { label: "Rank",      value: rankValue != null ? ordinal(rankValue) : "—", color: J.text },
              { label: "Net Worth", value: fmt.format(financialData.user.netWorth),       color: J.greenBright },
              { label: episodeData.onAir ? "Bonus" : "Budget", value: budgetDisplay,      color: J.gold },
            ].map(({ label, value, color }, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {i > 0 && <div style={{ width: 1, height: 24, background: J.divider }} />}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em" }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Cinzel', serif", color }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 12 }}>
            <div style={{ fontSize: 9, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              {episodeData.onAir ? "Bonus" : "Budget"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Cinzel', serif", color: J.gold }}>
              {budgetDisplay}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
