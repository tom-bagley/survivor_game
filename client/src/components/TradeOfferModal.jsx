import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const J = {
  bg:          "#0B1A2C",
  card:        "#0F2340",
  surface:     "#162B44",
  surfaceRing: "rgba(196,152,90,0.2)",
  green:       "#2D6A4F",
  greenBright: "#2D9E68",
  gold:        "#F2C94C",
  coral:       "#E8943A",
  text:        "#F5EDD0",
  textDim:     "rgba(245,237,208,0.5)",
  textFaint:   "rgba(245,237,208,0.22)",
  divider:     "rgba(196,152,90,0.18)",
};

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

function TradeStockRow({ survivorName, maxAmount, value, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ flex: 1, fontSize: 13, color: J.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {survivorName}
        {maxAmount != null && (
          <span style={{ color: J.textFaint, marginLeft: 6, fontSize: 11 }}>({maxAmount} owned)</span>
        )}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "none", color: J.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}
        >−</button>
        <span style={{ width: 28, textAlign: "center", fontSize: 14, fontWeight: 700, color: J.text }}>{value}</span>
        <button
          type="button"
          onClick={() => onChange(maxAmount != null ? Math.min(maxAmount, value + 1) : value + 1)}
          style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "none", color: J.text, cursor: "pointer", fontSize: 16, lineHeight: 1 }}
        >+</button>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{ width: 24, height: 24, borderRadius: 5, background: "rgba(223,101,72,0.15)", border: "none", color: J.coral, cursor: "pointer", fontSize: 13 }}
        >×</button>
      )}
    </div>
  );
}

export default function TradeOfferModal({
  isOpen,
  onClose,
  groupId,
  userId,
  groupMembers,      // [{ userId, name }]
  myPortfolio,       // { survivorName: count }
  myBudget,
  survivorNames,     // all survivor names (for "want" section)
  onTradeSent,
  incomingTrades = [],
  onAcceptIncoming,
  onDeclineIncoming,
}) {
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [offerMoney, setOfferMoney] = useState(0);
  const [offerStocks, setOfferStocks] = useState({});   // { survivorName: amount }
  const [requestMoney, setRequestMoney] = useState(0);
  const [requestStocks, setRequestStocks] = useState([]); // [{ survivorName, amount }]
  const [requestStockPicker, setRequestStockPicker] = useState("");
  const [sentTrades, setSentTrades] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [respondingId, setRespondingId] = useState(null);

  // Survivors I own (for offer section)
  const myStocks = Object.entries(myPortfolio || {}).filter(([, count]) => count > 0);

  // Survivors not already in requestStocks picker
  const requestableNames = (survivorNames || []).filter(
    n => !requestStocks.find(s => s.survivorName === n)
  );

  const fetchSentTrades = useCallback(async () => {
    if (!userId || !groupId) return;
    setLoadingSent(true);
    try {
      const { data } = await axios.get('/trades/sent', { params: { userId, groupId } });
      setSentTrades(data);
    } catch { /* silent */ }
    finally { setLoadingSent(false); }
  }, [userId, groupId]);

  useEffect(() => {
    if (isOpen) {
      fetchSentTrades();
      // Reset form
      setSelectedRecipient(null);
      setOfferMoney(0);
      setOfferStocks({});
      setRequestMoney(0);
      setRequestStocks([]);
      setRequestStockPicker("");
    }
  }, [isOpen, fetchSentTrades]);

  const handleCancelTrade = async (tradeId) => {
    setCancellingId(tradeId);
    try {
      await axios.put(`/trades/cancel/${tradeId}`, { userId });
      setSentTrades(prev => prev.filter(t => t._id !== tradeId));
      toast.success('Trade cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  const addRequestStock = () => {
    if (!requestStockPicker) return;
    setRequestStocks(prev => [...prev, { survivorName: requestStockPicker, amount: 1 }]);
    setRequestStockPicker("");
  };

  const updateRequestStock = (idx, amount) => {
    setRequestStocks(prev => prev.map((s, i) => i === idx ? { ...s, amount } : s));
  };

  const removeRequestStock = (idx) => {
    setRequestStocks(prev => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    if (!selectedRecipient) { toast.error('Select a recipient'); return false; }
    const totalOffer = offerMoney + Object.values(offerStocks).reduce((s, v) => s + v, 0);
    const totalRequest = requestMoney + requestStocks.reduce((s, r) => s + r.amount, 0);
    if (totalOffer === 0 && totalRequest === 0) { toast.error('Trade cannot be empty'); return false; }
    if (offerMoney > myBudget) { toast.error('Not enough budget'); return false; }
    for (const [name, amount] of Object.entries(offerStocks)) {
      if (amount > (myPortfolio[name] || 0)) { toast.error(`Not enough ${name} shares`); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const filteredOfferStocks = Object.entries(offerStocks)
        .filter(([, amount]) => amount > 0)
        .map(([survivorName, amount]) => ({ survivorName, amount }));

      await axios.post('/trades/send', {
        senderId: userId,
        recipientId: selectedRecipient,
        groupId,
        offerMoney,
        offerStocks: filteredOfferStocks,
        requestMoney,
        requestStocks: requestStocks.filter(s => s.amount > 0),
      });

      toast.success('Trade offer sent!');
      onTradeSent();
      // Refresh sent trades list
      fetchSentTrades();
      // Reset form but keep modal open so they can see pending offers
      setSelectedRecipient(null);
      setOfferMoney(0);
      setOfferStocks({});
      setRequestMoney(0);
      setRequestStocks([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sectionStyle = {
    borderRadius: 12,
    background: J.surface,
    border: `1px solid ${J.surfaceRing}`,
    padding: 16,
    marginBottom: 14,
  };

  const labelStyle = {
    fontSize: 10,
    color: J.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    marginBottom: 10,
    display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '24px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* gold glow */}
      <div className="pointer-events-none" style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', height: 240, width: 240, borderRadius: '50%', background: 'rgba(242,201,76,0.12)', filter: 'blur(48px)' }} />
      </div>

      <div
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 560,
          background: '#0F2340',
          borderRadius: 18,
          border: `1px solid rgba(196,152,90,0.25)`,
          color: J.text,
          padding: 24,
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: J.textFaint, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>Trading</div>
            <h2 style={{ fontSize: 20, fontFamily: "'Cinzel', serif", color: J.gold, margin: 0, letterSpacing: '0.04em' }}>
              Send a Trade Offer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: J.textDim, fontSize: 18, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
        </div>

        {/* ── Section A: Recipient ── */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Who do you want to trade with?</span>
          {groupMembers.length === 0 ? (
            <p style={{ fontSize: 13, color: J.textDim }}>No other members in this group to trade with.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {groupMembers.map(m => {
                const active = selectedRecipient === String(m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => setSelectedRecipient(String(m.userId))}
                    style={{
                      padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: active ? 700 : 400,
                      background: active ? 'rgba(242,201,76,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? 'rgba(242,201,76,0.5)' : J.surfaceRing}`,
                      color: active ? J.gold : J.textDim,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section B: You Give ── */}
        <div style={sectionStyle}>
          <span style={labelStyle}>You give</span>

          {/* Money */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: J.textDim, width: 60 }}>Money</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => setOfferMoney(m => Math.max(0, +(m - 1).toFixed(2)))}
                style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: J.text, cursor: 'pointer', fontSize: 16 }}>−</button>
              <input
                type="number"
                min={0}
                max={myBudget}
                step={1}
                value={offerMoney}
                onChange={e => setOfferMoney(Math.min(myBudget, Math.max(0, Number(e.target.value))))}
                style={{
                  width: 72, textAlign: 'center', padding: '5px 8px', borderRadius: 7,
                  background: 'rgba(212,168,67,0.08)', border: `1px solid rgba(212,168,67,0.2)`,
                  color: J.gold, fontWeight: 700, fontSize: 14,
                }}
              />
              <button type="button" onClick={() => setOfferMoney(m => Math.min(myBudget, +(m + 1).toFixed(2)))}
                style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: J.text, cursor: 'pointer', fontSize: 16 }}>+</button>
              <span style={{ fontSize: 11, color: J.textFaint }}>/ {fmt(myBudget)}</span>
            </div>
          </div>

          {/* Stocks I own */}
          {myStocks.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: J.textFaint, marginBottom: 8 }}>Stocks</div>
              {myStocks.map(([name, owned]) => (
                <TradeStockRow
                  key={name}
                  survivorName={name}
                  maxAmount={owned}
                  value={offerStocks[name] || 0}
                  onChange={(v) => setOfferStocks(prev => ({ ...prev, [name]: v }))}
                />
              ))}
            </>
          )}
          {myStocks.length === 0 && (
            <p style={{ fontSize: 12, color: J.textFaint, marginTop: 4 }}>You don't own any stocks to offer.</p>
          )}
        </div>

        {/* ── Section C: You Want ── */}
        <div style={sectionStyle}>
          <span style={labelStyle}>You want in return</span>

          {/* Money */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: J.textDim, width: 60 }}>Money</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => setRequestMoney(m => Math.max(0, +(m - 1).toFixed(2)))}
                style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: J.text, cursor: 'pointer', fontSize: 16 }}>−</button>
              <input
                type="number"
                min={0}
                step={1}
                value={requestMoney}
                onChange={e => setRequestMoney(Math.max(0, Number(e.target.value)))}
                style={{
                  width: 72, textAlign: 'center', padding: '5px 8px', borderRadius: 7,
                  background: 'rgba(212,168,67,0.08)', border: `1px solid rgba(212,168,67,0.2)`,
                  color: J.gold, fontWeight: 700, fontSize: 14,
                }}
              />
              <button type="button" onClick={() => setRequestMoney(m => +(m + 1).toFixed(2))}
                style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: J.text, cursor: 'pointer', fontSize: 16 }}>+</button>
            </div>
          </div>

          {/* Requested stocks */}
          {requestStocks.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: J.textFaint, marginBottom: 8 }}>Stocks</div>
              {requestStocks.map((s, i) => (
                <TradeStockRow
                  key={s.survivorName}
                  survivorName={s.survivorName}
                  maxAmount={null}
                  value={s.amount}
                  onChange={(v) => updateRequestStock(i, v)}
                  onRemove={() => removeRequestStock(i)}
                />
              ))}
            </div>
          )}

          {/* Add stock picker */}
          {requestableNames.length > 0 && (
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={requestStockPicker}
                onChange={e => setRequestStockPicker(e.target.value)}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 8,
                  background: '#162B44', border: `1px solid ${J.surfaceRing}`,
                  color: requestStockPicker ? J.text : J.textFaint, fontSize: 13,
                }}
              >
                <option value="" style={{ background: '#162B44', color: J.textFaint }}>Add a stock…</option>
                {requestableNames.map(n => <option key={n} value={n} style={{ background: '#162B44', color: J.text }}>{n}</option>)}
              </select>
              <button
                type="button"
                onClick={addRequestStock}
                disabled={!requestStockPicker}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: requestStockPicker ? 'rgba(242,201,76,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${requestStockPicker ? 'rgba(242,201,76,0.4)' : J.surfaceRing}`,
                  color: requestStockPicker ? J.gold : J.textFaint,
                  cursor: requestStockPicker ? 'pointer' : 'not-allowed',
                }}
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedRecipient}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 15, fontWeight: 700,
            fontFamily: "'Josefin Sans', sans-serif", letterSpacing: '0.06em',
            background: submitting || !selectedRecipient ? 'rgba(212,168,67,0.25)' : J.gold,
            color: submitting || !selectedRecipient ? J.textFaint : '#1a0f00',
            border: 'none', cursor: submitting || !selectedRecipient ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {submitting ? 'Sending…' : 'Send Trade Offer'}
        </button>

        {/* ── Pending sent offers ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, color: J.textFaint, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10 }}>
            Your Pending Offers
          </div>
          {loadingSent && <p style={{ fontSize: 12, color: J.textFaint }}>Loading…</p>}
          {!loadingSent && sentTrades.length === 0 && (
            <p style={{ fontSize: 12, color: J.textFaint }}>No pending offers.</p>
          )}
          {sentTrades.map(t => {
            const offerParts = [];
            if (t.offerMoney > 0) offerParts.push(fmt(t.offerMoney));
            (t.offerStocks || []).forEach(s => offerParts.push(`${s.amount}× ${s.survivorName}`));
            const wantParts = [];
            if (t.requestMoney > 0) wantParts.push(fmt(t.requestMoney));
            (t.requestStocks || []).forEach(s => wantParts.push(`${s.amount}× ${s.survivorName}`));

            return (
              <div
                key={t._id}
                style={{
                  borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${J.surfaceRing}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                }}
              >
                <div style={{ fontSize: 12, color: J.textDim, flex: 1, minWidth: 0 }}>
                  <span style={{ color: J.text, fontWeight: 600 }}>Giving:</span> {offerParts.join(', ') || '—'}
                  <span style={{ margin: '0 6px', color: J.textFaint }}>·</span>
                  <span style={{ color: J.text, fontWeight: 600 }}>Wanting:</span> {wantParts.join(', ') || '—'}
                </div>
                <button
                  type="button"
                  onClick={() => handleCancelTrade(t._id)}
                  disabled={cancellingId === t._id}
                  style={{
                    padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                    background: 'rgba(223,101,72,0.1)', border: `1px solid rgba(223,101,72,0.25)`,
                    color: J.coral, cursor: cancellingId === t._id ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap', opacity: cancellingId === t._id ? 0.5 : 1,
                  }}
                >
                  {cancellingId === t._id ? '…' : 'Cancel'}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Received Offers ── */}
        {incomingTrades.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 10, color: J.coral, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10 }}>
              Received Offers ({incomingTrades.length})
            </div>
            {incomingTrades.map((t) => {
              const offerParts = [];
              if (t.offerMoney > 0) offerParts.push(fmt(t.offerMoney));
              (t.offerStocks || []).forEach(s => offerParts.push(`${s.amount}× ${s.survivorName}`));
              const wantParts = [];
              if (t.requestMoney > 0) wantParts.push(fmt(t.requestMoney));
              (t.requestStocks || []).forEach(s => wantParts.push(`${s.amount}× ${s.survivorName}`));
              const busy = respondingId === t._id;

              return (
                <div
                  key={t._id}
                  style={{
                    borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                    background: 'rgba(212,168,67,0.05)', border: `1px solid rgba(212,168,67,0.2)`,
                  }}
                >
                  <div style={{ fontSize: 12, color: J.textDim, marginBottom: 8 }}>
                    <span style={{ color: J.gold, fontWeight: 600 }}>{t.senderName}</span> offers:{' '}
                    <span style={{ color: J.greenBright }}>{offerParts.join(', ') || '—'}</span>
                    <span style={{ margin: '0 6px', color: J.textFaint }}>for your</span>
                    <span style={{ color: J.coral }}>{wantParts.join(', ') || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setRespondingId(t._id);
                        try {
                          await axios.put(`/trades/accept/${t._id}`, { userId, groupId });
                          toast.success('Trade accepted!');
                          onAcceptIncoming?.(t._id);
                        } catch (err) {
                          toast.error(err.response?.data?.error || 'Failed to accept');
                        } finally { setRespondingId(null); }
                      }}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 700,
                        background: busy ? 'rgba(242,201,76,0.2)' : J.gold,
                        color: busy ? J.textFaint : '#1a0f00',
                        border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {busy ? '…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setRespondingId(t._id);
                        try {
                          await axios.put(`/trades/decline/${t._id}`, { userId });
                          toast.success('Trade declined');
                          onDeclineIncoming?.(t._id);
                        } catch (err) {
                          toast.error(err.response?.data?.error || 'Failed to decline');
                        } finally { setRespondingId(null); }
                      }}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        background: 'transparent', border: `1px solid rgba(223,101,72,0.35)`,
                        color: J.coral, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
