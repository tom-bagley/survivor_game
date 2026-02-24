import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../context/userContext";
import axios from "axios";
import { J } from "../Dashboard/colors";

const fmt = (n) =>
  "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

const rankColor = (rank) => {
  if (rank === 1) return J.gold;
  if (rank === 2) return "rgba(196,196,210,0.9)";
  if (rank === 3) return "#cd7f32";
  return J.textDim;
};

export default function Leaderboard() {
  const { user, loading } = useContext(UserContext);
  const [leaders, setLeaders] = useState([]);
  const [myEntry, setMyEntry] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    if (loading || !user) return;
    async function fetchLeaders() {
      try {
        const params = user?.id ? { userId: user.id } : {};
        const { data } = await axios.get("/leaderboard/solo-top10", { params });
        setLeaders(data.topTen || []);
        setMyEntry(data.myEntry || null);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }
    fetchLeaders();
  }, [user, loading]);

  if (loadingLeaderboard) {
    return (
      <div style={{ minHeight: "100vh", background: J.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: J.textDim, fontSize: 15 }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            border: `3px solid ${J.surfaceRing}`, borderTopColor: J.gold,
            animation: "spin 0.8s linear infinite",
          }} />
          Loading leaderboard…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const topTen = leaders;

  return (
    <div style={{ minHeight: "100vh", background: J.bg, color: J.text, padding: "32px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 6 }}>
            Solo Rankings
          </div>
          <h1 style={{ fontSize: 28, fontFamily: "'Cinzel', serif", color: J.gold, margin: 0, letterSpacing: "0.04em" }}>
            Leaderboard
          </h1>
          <p style={{ fontSize: 13, color: J.textDim, marginTop: 6 }}>
            Top 10 solo players by net worth
          </p>
        </div>

        {/* Table */}
        <div style={{
          borderRadius: 16,
          background: J.card,
          border: `1px solid rgba(196,152,90,0.2)`,
          overflow: "hidden",
        }}>
          {/* Column headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "56px 1fr auto",
            padding: "10px 16px",
            background: "rgba(0,0,0,0.25)",
            borderBottom: `1px solid ${J.divider}`,
            fontSize: 10, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em",
          }}>
            <div>Rank</div>
            <div>Player</div>
            <div style={{ textAlign: "right" }}>Net Worth</div>
          </div>

          {topTen.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center", color: J.textFaint, fontSize: 13 }}>
              No rankings yet.
            </div>
          )}

          {topTen.map((leader, i) => {
            const isMe = user && leader.userId === user.id;
            const medal = MEDALS[leader.rank];
            return (
              <div
                key={leader.userId}
                style={{
                  display: "grid", gridTemplateColumns: "56px 1fr auto",
                  padding: "13px 16px",
                  alignItems: "center",
                  borderBottom: i < topTen.length - 1 ? `1px solid ${J.divider}` : "none",
                  background: isMe ? "rgba(242,201,76,0.06)" : "transparent",
                  outline: isMe ? `1px solid rgba(242,201,76,0.2)` : "none",
                  outlineOffset: -1,
                  transition: "background 0.15s",
                }}
              >
                {/* Rank */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {medal ? (
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{medal}</span>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 700, color: rankColor(leader.rank), fontVariantNumeric: "tabular-nums" }}>
                      #{leader.rank}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{
                    fontSize: 14, fontWeight: isMe ? 700 : 500,
                    color: isMe ? J.gold : J.text,
                  }}>
                    {leader.username}
                    {isMe && (
                      <span style={{ marginLeft: 8, fontSize: 10, color: J.gold, fontWeight: 400, opacity: 0.7 }}>
                        (you)
                      </span>
                    )}
                  </span>
                </div>

                {/* Net worth */}
                <div style={{
                  textAlign: "right", fontSize: 14, fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  color: leader.rank <= 3 ? rankColor(leader.rank) : J.textDim,
                }}>
                  {fmt(leader.netWorth)}
                </div>
              </div>
            );
          })}

          {/* User's row if outside top 10 */}
          {myEntry && (
            <>
              <div style={{ padding: "6px 16px", background: "rgba(0,0,0,0.2)", borderTop: `1px solid ${J.divider}` }}>
                <span style={{ fontSize: 10, color: J.textFaint, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                  Your position
                </span>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "56px 1fr auto",
                padding: "13px 16px", alignItems: "center",
                background: "rgba(242,201,76,0.06)",
                outline: `1px solid rgba(242,201,76,0.2)`, outlineOffset: -1,
              }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: J.textDim, fontVariantNumeric: "tabular-nums" }}>
                    #{myEntry.rank}
                  </span>
                </div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: J.gold }}>
                    {myEntry.username || user?.name || "You"}
                    <span style={{ marginLeft: 8, fontSize: 10, color: J.gold, fontWeight: 400, opacity: 0.7 }}>(you)</span>
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: J.textDim, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(myEntry.netWorth)}
                </div>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: J.textFaint, marginTop: 16 }}>
          Rankings update after each episode.
        </p>
      </div>
    </div>
  );
}
