import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { J } from "./colors";

const NAVBAR_H = 56;
export const HUD_H        = 40;
export const HUD_H_MOBILE = 76;

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function useHudHeight() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile ? HUD_H_MOBILE : HUD_H;
}

const selectBase = {
  background: "rgba(15,35,64,0.95)",
  border: `1px solid ${J.surfaceRing}`,
  color: J.text,
  fontSize: 11,
  borderRadius: 8,
  padding: "3px 22px 3px 8px",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  outline: "none",
  fontFamily: "inherit",
  flexShrink: 0,
};

function SelectWrap({ children, style }) {
  return (
    <div style={{ position: "relative", flexShrink: 0, ...style }}>
      {children}
      <span style={{
        position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", color: J.textFaint, fontSize: 9, lineHeight: 1,
      }}>▾</span>
    </div>
  );
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
  groupStandings,
}) {
  const hudHeight = useHudHeight();
  const isMobile  = hudHeight === HUD_H_MOBILE;
  const [showStandings, setShowStandings] = useState(false);

  const weekLabel     = Number(seasonData.currentWeek) === 0 ? "Preseason" : `Week ${seasonData.currentWeek}`;
  const rankValue     = leaderboard && typeof leaderboard === "object" ? leaderboard.rank : leaderboard;
  const budgetDisplay = fmt.format(financialData.user.budget);

  /* ── Stats ── */
  const rankDropdown = showStandings && groupStandings?.length > 0 && (
    <div style={{
      position: "absolute",
      top: "calc(100% + 8px)",
      right: 0,
      zIndex: 100,
      background: "rgba(9,20,38,0.97)",
      border: `1px solid ${J.surfaceRing}`,
      borderRadius: 10,
      overflow: "hidden",
      minWidth: 260,
      boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      backdropFilter: "blur(12px)",
    }}>
      {groupStandings.map((member, i) => {
        const isMe = String(member.userId) === String(user?.id);
        return (
          <div key={member.userId} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "7px 12px",
            borderBottom: i < groupStandings.length - 1 ? `1px solid ${J.divider}` : "none",
            background: isMe ? "rgba(58,148,84,0.1)" : "transparent",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Cinzel', serif", color: isMe ? J.greenBright : J.textFaint, minWidth: 28 }}>
              {ordinal(member.rank)}
            </span>
            <span style={{ fontSize: 12, color: isMe ? J.text : J.textDim, fontWeight: isMe ? 700 : 400, flex: 1 }}>
              {member.name}{isMe && " ★"}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Cinzel', serif", color: isMe ? J.greenBright : J.textDim }}>
              {fmt.format(member.netWorth ?? 0)}
            </span>
          </div>
        );
      })}
    </div>
  );

  const statsSection = Number(seasonData.currentWeek) > 0 ? (
    <div style={{ display: "flex", gap: isMobile ? 10 : 20, alignItems: "center", flexShrink: 0 }}>
      {/* Rank — clickable */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setShowStandings(v => !v)}
          style={{ background: "none", border: "none", padding: 0, cursor: groupStandings?.length > 0 ? "pointer" : "default", textAlign: "right", fontFamily: "inherit" }}
        >
          <div style={{ fontSize: 8, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.12em", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
            Rank{groupStandings?.length > 0 && <span style={{ fontSize: 7 }}>{showStandings ? "▲" : "▼"}</span>}
          </div>
          <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, fontFamily: "'Cinzel', serif", color: J.text }}>
            {rankValue != null ? ordinal(rankValue) : "—"}
          </div>
        </button>
        {rankDropdown}
      </div>

      {/* Net Worth */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 20 }}>
        <div style={{ width: 1, height: 20, background: J.divider }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.12em" }}>Net Worth</div>
          <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, fontFamily: "'Cinzel', serif", color: J.greenBright }}>{fmt.format(financialData.user.netWorth)}</div>
        </div>
      </div>

      {/* Budget */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 20 }}>
        <div style={{ width: 1, height: 20, background: J.divider }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.12em" }}>Budget</div>
          <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, fontFamily: "'Cinzel', serif", color: J.gold }}>{budgetDisplay}</div>
        </div>
      </div>
    </div>
  ) : (
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ fontSize: 8, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Budget
      </div>
      <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 800, fontFamily: "'Cinzel', serif", color: J.gold }}>
        {budgetDisplay}
      </div>
    </div>
  );

  /* ── Mobile controls (dropdowns) ── */
  const mobileControls = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>

      {/* Group dropdown */}
      {!user?.isGuest && userGroups.length > 1 && (
        <SelectWrap>
          <select
            value={groupId}
            onChange={e => onSwitchGroup(e.target.value)}
            style={{ ...selectBase, color: J.greenBright, borderColor: "rgba(58,140,82,0.4)", fontWeight: 600 }}
          >
            {userGroups.map(g => (
              <option key={g._id} value={String(g._id)}>{g.displayName}</option>
            ))}
          </select>
        </SelectWrap>
      )}

      {/* Sort dropdown */}
      <SelectWrap>
        <select
          value={appliedSort}
          onChange={e => onSort(e.target.value)}
          style={{ ...selectBase, color: J.gold, borderColor: "rgba(212,168,67,0.35)", fontWeight: 600 }}
        >
          <option value="name">A → Z</option>
          <option value="stock">Most Owned</option>
        </select>
      </SelectWrap>

      {/* Trade button */}
      {!user?.isGuest && groupMembers.length > 0 && (
        <button type="button" onClick={onShowTradeModal} style={{
          padding: "3px 9px", borderRadius: 8, flexShrink: 0,
          background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)",
          color: J.gold, fontSize: 11, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
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
      )}

      {/* Guest links */}
      {(!user || user.isGuest) && (
        <>
          <Link to="/register" style={{
            padding: "3px 11px", borderRadius: 8, background: J.green, color: J.text,
            fontWeight: 700, fontSize: 11, textDecoration: "none", fontFamily: "'Cinzel', serif", flexShrink: 0,
          }}>Sign Up</Link>
          <Link to="/login" style={{
            padding: "3px 11px", borderRadius: 8, background: "transparent",
            border: `1px solid ${J.surfaceRing}`, color: J.textDim,
            fontWeight: 600, fontSize: 11, textDecoration: "none", flexShrink: 0,
          }}>Log In</Link>
        </>
      )}
    </div>
  );

  /* ── Desktop controls (pill buttons) ── */
  const desktopControls = (
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
  );

  return (
    <div
      style={{
        position: "fixed",
        top: Math.max(NAVBAR_H - scrollY, 0),
        left: 0, right: 0,
        height: hudHeight,
        zIndex: 35,
        background: "rgba(9,20,38,0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${J.divider}`,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        className="mx-auto max-w-[1400px]"
        style={{
          width: "100%", height: "100%",
          padding: "0 12px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
        }}
      >
        {isMobile ? (
          <>
            {/* Mobile row 1: season / live  ·  stats */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
                <span style={{
                  fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: J.textFaint,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {seasonData.seasonName && `${seasonData.seasonName} · `}{weekLabel}
                </span>
                {episodeData.onAir && (
                  <span style={{
                    fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: "0.12em",
                    textTransform: "uppercase", fontWeight: 700,
                    color: "#ff4444", display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#ff4444",
                      boxShadow: "0 0 6px #ff4444",
                      animation: "livePulse 1.4s ease-in-out infinite",
                      display: "inline-block",
                    }} />
                    Live
                  </span>
                )}
              </div>
              {statsSection}
            </div>

            {/* Mobile row 2: dropdown controls */}
            <div style={{ display: "flex", alignItems: "center", flex: 1, borderTop: `1px solid ${J.divider}` }}>
              {mobileControls}
            </div>
          </>
        ) : (
          <>
            {/* Desktop: left — season / live */}
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

            {/* Desktop: center — pill button controls */}
            {desktopControls}

            <div style={{ width: 1, height: 16, background: J.divider, flexShrink: 0 }} />

            {/* Desktop: right — stats */}
            <div style={{ paddingLeft: 12, flexShrink: 0 }}>
              {statsSection}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
