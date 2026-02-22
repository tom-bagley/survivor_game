import { J } from "./colors";
import ScoreEfficiencyBar from "../../components/ScoreEfficiencyBar";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function DashboardHero({ user, seasonData, episodeData, financialData }) {
  const budgetDisplay = episodeData.onAir && financialData.user.liveBonusBalance != null
    ? fmt.format(financialData.user.liveBonusBalance)
    : fmt.format(financialData.user.budget);

  return (
    <div style={{ borderBottom: `1px solid ${J.divider}`, marginBottom: 0 }}>
      <div className="mx-auto max-w-[1400px]" style={{ padding: "16px 28px 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
          <h1
            className="font-heading"
            style={{ fontSize: "clamp(20px, 2.5vw, 28px)", lineHeight: 1.2, color: J.text, margin: 0 }}
          >
            {user?.isGuest
              ? "Try the Game"
              : <><span style={{ color: J.gold }}>{user?.name}</span>{" "}is in the game.</>}
          </h1>

          {Number(seasonData.currentWeek) > 0 && !user?.isGuest && (
            <span style={{ fontSize: 13, color: J.textDim }}>
              <span style={{ color: J.greenBright, fontWeight: 600 }}>{fmt.format(financialData.user.netWorth)}</span>
              {" "}·{" "}
              <span style={{ color: J.gold, fontWeight: 600 }}>{budgetDisplay}</span>
              {" "}{episodeData.onAir ? "bonus" : "to spend"}
            </span>
          )}

          {Number(seasonData.currentWeek) < 1 && (
            <span style={{ fontSize: 13, color: J.textDim }}>
              <span style={{ color: J.gold, fontWeight: 600 }}>{fmt.format(financialData.user.budget)}</span>
              {" "}to spend
            </span>
          )}
        </div>

        {!user?.isGuest && Number(seasonData.currentWeek) > 0 && financialData.maxPossibleBudget != null && (
          <div style={{ maxWidth: 520 }}>
            <ScoreEfficiencyBar
              netWorth={financialData.user.netWorth}
              maxPossibleBudget={financialData.maxPossibleBudget}
              maxPossibleLog={financialData.maxPossibleLog}
            />
          </div>
        )}
      </div>
    </div>
  );
}
