import { useEffect, useCallback, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function IncomingTradeNotification({ trade, userId, groupId, onAccept, onDecline, onClose }) {
  const [loading, setLoading] = useState(null); // 'accept' | 'decline' | null

  const handleAccept = useCallback(async () => {
    setLoading('accept');
    try {
      await axios.put(`/trades/accept/${trade._id}`, { userId, groupId });
      onAccept();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept trade');
      setLoading(null);
    }
  }, [trade._id, userId, groupId, onAccept]);

  const handleDecline = useCallback(async () => {
    setLoading('decline');
    try {
      await axios.put(`/trades/decline/${trade._id}`, { userId });
      onDecline();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to decline trade');
      setLoading(null);
    }
  }, [trade._id, userId, onDecline]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Close the notification without declining — trade stays pending
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!loading) handleAccept();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAccept, onClose, loading]);

  const hasOfferMoney = trade.offerMoney > 0;
  const hasOfferStocks = trade.offerStocks && trade.offerStocks.length > 0;
  const hasRequestMoney = trade.requestMoney > 0;
  const hasRequestStocks = trade.requestStocks && trade.requestStocks.length > 0;

  const sentDate = new Date(trade.createdAt);
  const timeAgo = (() => {
    const diff = Date.now() - sentDate.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs === 1) return '1 hour ago';
    return `${hrs} hours ago`;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white">
      {/* gold glow */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position: 'absolute', top: -96, left: '50%', transform: 'translateX(-50%)', height: 288, width: 288, borderRadius: '50%', background: 'rgba(212,168,67,0.3)', filter: 'blur(48px)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: -96, right: -64, height: 320, width: 320, borderRadius: '50%', background: 'rgba(212,168,67,0.2)', filter: 'blur(48px)', opacity: 0.3 }} />
      </div>

      <div className="relative z-10 h-[100dvh] w-full flex flex-col">
        {/* top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
          <div className="text-xs text-white/60 font-mono tracking-widest uppercase">Trade Offer</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 focus:outline-none"
          >
            Later
          </button>
        </div>

        {/* main content */}
        <div className="flex-1 px-4 sm:px-8 py-4 overflow-y-auto">
          <div className="min-h-full grid place-items-center">
            <div className="animate-fadein text-center w-full max-w-lg">

              <div className="text-4xl mb-3">🤝</div>
              <h1 className="font-heading text-2xl sm:text-3xl tracking-tight" style={{ color: '#d4a843' }}>
                Trade Offer
              </h1>
              <p className="mt-1 text-white/60 text-sm">
                from <span className="font-semibold text-white">{trade.senderName}</span>
                <span className="ml-2 text-white/40">· {timeAgo}</span>
              </p>

              {/* offer panels */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                {/* they give */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(94,207,122,0.08)', border: '1px solid rgba(94,207,122,0.25)' }}>
                  <div className="text-xs text-white/50 uppercase tracking-widest mb-3">They give you</div>
                  {!hasOfferMoney && !hasOfferStocks && (
                    <div className="text-white/30 text-sm italic">Nothing</div>
                  )}
                  {hasOfferMoney && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💵</span>
                      <span className="font-bold text-lg" style={{ color: '#5ecf7a' }}>{fmt(trade.offerMoney)}</span>
                    </div>
                  )}
                  {hasOfferStocks && trade.offerStocks.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span className="text-base">📊</span>
                      <span className="text-sm text-white/80">
                        <span className="font-semibold text-white">{s.amount}</span> × {s.survivorName}
                      </span>
                    </div>
                  ))}
                </div>

                {/* they want */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.25)' }}>
                  <div className="text-xs text-white/50 uppercase tracking-widest mb-3">They want from you</div>
                  {!hasRequestMoney && !hasRequestStocks && (
                    <div className="text-white/30 text-sm italic">Nothing</div>
                  )}
                  {hasRequestMoney && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💵</span>
                      <span className="font-bold text-lg" style={{ color: '#d4a843' }}>{fmt(trade.requestMoney)}</span>
                    </div>
                  )}
                  {hasRequestStocks && trade.requestStocks.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span className="text-base">📊</span>
                      <span className="text-sm text-white/80">
                        <span className="font-semibold text-white">{s.amount}</span> × {s.survivorName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* bottom controls */}
        <div className="px-4 sm:px-8 pb-6 pt-2">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDecline}
              disabled={!!loading}
              className="rounded-lg font-bold px-6 py-3 text-base transition-colors focus:outline-none"
              style={{
                background: 'transparent',
                border: '1px solid rgba(223,101,72,0.5)',
                color: '#df6548',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading === 'decline' ? 'Declining…' : 'Decline'}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!!loading}
              className="rounded-lg font-bold px-8 py-3 text-base transition-colors focus:outline-none"
              style={{
                background: loading ? 'rgba(94,207,122,0.5)' : '#5ecf7a',
                color: 'black',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading === 'accept' ? 'Accepting…' : 'Accept Trade'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadein { animation: fadeInUp .6s ease-out both; }
      `}</style>
    </div>
  );
}
