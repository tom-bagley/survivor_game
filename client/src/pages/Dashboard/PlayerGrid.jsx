import BuyOrShortDisplay from "../../components/BuyOrShortStockDisplay";

export default function PlayerGrid({
  displayOrder,
  survivorPlayerStats,
  financialData,
  sharesOwned,
  shortsOwned,
  episodeData,
  buyStock,
  sellStock,
  shortStock,
  coverShort,
}) {
  const maxPer = financialData.maxSharesPerPlayer ?? 50;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" style={{ gap: 12 }}>
      {displayOrder.map((survivorPlayer) => {
        const survivor = survivorPlayerStats[survivorPlayer];
        if (!survivor) return null;
        return (
          <div key={survivorPlayer}>
            <BuyOrShortDisplay
              name={survivorPlayer}
              profilePhotoUrl={survivor.profile_pic}
              shares={sharesOwned[survivorPlayer] ?? 0}
              availableShares={(financialData.availableShares ?? {})[survivorPlayer] ?? maxPer}
              maxSharesPerPlayer={maxPer}
              shorts={shortsOwned[survivorPlayer] ?? 0}
              availableShorts={(financialData.availableShorts ?? {})[survivorPlayer] ?? maxPer}
              currentPrice={(financialData.currentPrices ?? {})[survivorPlayer] ?? 1}
              isOnAir={episodeData.onAir}
              tribalCouncil={episodeData.tribalCouncil}
              liveBonusBalance={financialData.user.liveBonusBalance}
              buyStock={buyStock}
              sellStock={sellStock}
              shortStock={shortStock}
              coverShort={coverShort}
            />
          </div>
        );
      })}
    </div>
  );
}
