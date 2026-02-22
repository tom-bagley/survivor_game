export default function LiveBanners({ episodeData }) {
  return (
    <>
      {episodeData.onAir && !episodeData.tribalCouncil && (
        <div style={{
          background: "rgba(180,30,30,0.12)",
          borderTop: "1px solid rgba(255,68,68,0.25)",
          borderBottom: "1px solid rgba(255,68,68,0.25)",
        }}>
          <div className="mx-auto max-w-[1400px]" style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 8px #ff4444", display: "inline-block", flexShrink: 0, animation: "livePulse 1.4s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, fontFamily: "'Cinzel', serif", letterSpacing: "0.16em", textTransform: "uppercase", color: "#ff8888", fontWeight: 700 }}>
              Episode Live
            </span>
            <span style={{ fontSize: 12, color: "rgba(226,240,232,0.45)", marginLeft: 6 }}>
              · Your positions are locked. Idol bonus money can still be invested.
            </span>
          </div>
        </div>
      )}

      {episodeData.tribalCouncil && (
        <div style={{
          background: "rgba(180,80,0,0.15)",
          borderTop: "1px solid rgba(255,140,0,0.3)",
          borderBottom: "1px solid rgba(255,140,0,0.3)",
        }}>
          <div className="mx-auto max-w-[1400px]" style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 12, fontFamily: "'Cinzel', serif", letterSpacing: "0.16em", textTransform: "uppercase", color: "#ffaa44", fontWeight: 700 }}>
              Tribal Council
            </span>
            <span style={{ fontSize: 12, color: "rgba(226,240,232,0.45)", marginLeft: 6 }}>
              · All trading is locked until tribal council ends.
            </span>
          </div>
        </div>
      )}
    </>
  );
}
