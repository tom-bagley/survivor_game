import BuyStockDisplay from "../../components/BuyStockDisplay";

export default function PlayerGrid({
  displayOrder,
  survivorPlayerStats,
  financialData,
  sharesOwned,
  episodeData,
  buyStock,
  sellStock,
}) {
  const maxPer = financialData.maxSharesPerPlayer ?? 50;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: 8 }}>
      {displayOrder.map((survivorPlayer) => {
        const survivor = survivorPlayerStats[survivorPlayer];
        if (!survivor) return null;
        return (
          <div key={survivorPlayer}>
            <BuyStockDisplay
              name={survivorPlayer}
              profilePhotoUrl={survivor.profile_pic}
              shares={sharesOwned[survivorPlayer] ?? 0}
              availableShares={(financialData.availableShares ?? {})[survivorPlayer] ?? maxPer}
              currentPrice={(financialData.currentPrices ?? {})[survivorPlayer] ?? 1}
              isEliminated={survivor.availability === false}
              tribalCouncil={episodeData.tribalCouncil}
              buyStock={buyStock}
              sellStock={sellStock}
            />
          </div>
        );
      })}
    </div>
  );
}
