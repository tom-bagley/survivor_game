import { useState } from "react";
import { J } from "./colors";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function DashboardHero({ user, seasonData, financialData, groupStandings }) {
  const [showStandings, setShowStandings] = useState(false);
  const budgetDisplay = fmt.format(financialData.user.budget);
  const isInSeason = Number(seasonData.currentWeek) > 0;

  return (
    <div style={{ borderBottom: `1px solid ${J.divider}`, marginBottom: 0 }}>
      <div className="mx-auto max-w-[1400px]" style={{ padding: "16px 28px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: showStandings ? 8 : 0 }}>
          <h1
            className="font-heading"
            style={{
              fontSize: "clamp(20px, 2.5vw, 28px)",
              lineHeight: 1.2,
              color: J.text,
              margin: 0,
            }}
          >
            {user?.isGuest
              ? "Try the Game"
              : (
                <>
                  <span style={{ color: J.gold }}>{user?.name}</span>{" "}
                </>
              )}
          </h1>

          {user?.isGuest && (
            <p
              style={{
                fontSize: "14px",
                opacity: 0.8,
                marginTop: "6px",
                color: J.text,
              }}
            >
              Sign up to save your results or log in to access your account.
            </p>
          )}

          {isInSeason && !user?.isGuest && (
            <span style={{ fontSize: 13, color: J.textDim }}>
              <button
                type="button"
                onClick={() => setShowStandings(v => !v)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ color: J.greenBright, fontWeight: 600 }}>{fmt.format(financialData.user.netWorth)}</span>
                <span style={{ fontSize: 9, color: J.textFaint }}>{showStandings ? "▲" : "▼"}</span>
              </button>
              {" "}·{" "}
              <span style={{ color: J.gold, fontWeight: 600 }}>{budgetDisplay}</span>
              {" "}to spend
            </span>
          )}

          {!isInSeason && (
            <span style={{ fontSize: 13, color: J.textDim }}>
              <span style={{ color: J.gold, fontWeight: 600 }}>{fmt.format(financialData.user.budget)}</span>
              {" "}to spend
            </span>
          )}
        </div>

        {showStandings && isInSeason && !user?.isGuest && groupStandings?.length > 0 && (
          <div style={{
            maxWidth: 320,
            background: J.surface,
            border: `1px solid ${J.surfaceRing}`,
            borderRadius: 10,
            overflow: "hidden",
          }}>
            {groupStandings.map((member, i) => {
              const isMe = String(member.userId) === String(user?.id);
              return (
                <div
                  key={member.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 12px",
                    borderBottom: i < groupStandings.length - 1 ? `1px solid ${J.divider}` : "none",
                    background: isMe ? "rgba(58,148,84,0.1)" : "transparent",
                  }}
                >
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'Cinzel', serif",
                    color: isMe ? J.greenBright : J.textFaint,
                    minWidth: 28,
                  }}>
                    {ordinal(member.rank)}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: isMe ? J.text : J.textDim,
                    fontWeight: isMe ? 700 : 400,
                    flex: 1,
                  }}>
                    {member.name}{isMe && " ★"}
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Cinzel', serif",
                    color: isMe ? J.greenBright : J.textDim,
                  }}>
                    {fmt.format(member.netWorth ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
