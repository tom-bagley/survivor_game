import { useEffect, useState, useMemo } from "react";

function EliminationSequence({
  // showAnimation,
  week,
  eliminatedSurvivors,
  survivorPlayerStats,
  sharesOwned,
  prices,
  medianPrice,
  prevNetWorth,
  netWorth,
}) {
  const [stageIndex, setStageIndex] = useState(0);

  const SURVIVOR_STAGE_DELAY = 3000;
  const FINAL_STAGE_DELAY = 60000;

  const survivorList = useMemo(
    () => Object.keys(eliminatedSurvivors).map((id) => eliminatedSurvivors[id]),
    [eliminatedSurvivors]
  );

  const totalStages = survivorList.length + 2;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    // if (!showAnimation || week <= 0) return;

    let cancelled = false;

    const runSequence = async () => {
      for (let i = 0; i < totalStages; i++) {
        console.log(i)
        if (cancelled) break;
        setStageIndex(i);
        const isFinal = i === totalStages - 1;
        await sleep(isFinal ? FINAL_STAGE_DELAY : SURVIVOR_STAGE_DELAY);
      }
    };

    runSequence();

    return () => {
      cancelled = true;
    };
  }, [totalStages]);

  // if (!showAnimation || week <= 0) return null;

  const renderSurvivorStage = (name) => {
    const survivor = survivorPlayerStats[name];
    const shares = sharesOwned[name] || 0;
    const price = week === 0 ? medianPrice : prices[name];
    const holdingsValue = shares * price;

    return (
      <div className="fade-in" style={{ textAlign: "center" }}>
        <h1>
          Eliminated: {survivor.name}
        </h1>
        <img
          src={survivor.profile_pic}
          alt={name}
          style={{
            width: 500,
            height: 500,
            objectFit: "cover",
            borderRadius: 4,
            marginBottom: "1rem",
          }}
        />
        <div style={{ fontSize: "1.5rem" }}>
          Money Lost: {holdingsValue.toFixed(2)}
        </div>
      </div>
    );
  };

  const renderNetWorthStage = () => (
    <div
      className="fade-in"
      style={{ fontSize: "1.5rem", textAlign: "center" }}
    >
      Previous Net Worth: {prevNetWorth.toFixed(2)}
      <br />
      Current Net Worth: {netWorth.toFixed(2)}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "black",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      {stageIndex < survivorList.length
        ? renderSurvivorStage(survivorList[stageIndex])
        : renderNetWorthStage()}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 1s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

export default EliminationSequence;


