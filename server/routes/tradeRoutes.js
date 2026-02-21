const router = require('express').Router();
const { requireAuth } = require('../authMiddleware/authMiddleware');
const {
  sendOffer,
  getPendingIncoming,
  getSentTrades,
  getGroupMembers,
  acceptTrade,
  declineTrade,
  cancelTrade,
} = require('../controllers/tradeControllers');

router.post('/send',             requireAuth, sendOffer);
router.get('/pending',           requireAuth, getPendingIncoming);
router.get('/sent',              requireAuth, getSentTrades);
router.get('/group-members',     requireAuth, getGroupMembers);
router.put('/accept/:tradeId',   requireAuth, acceptTrade);
router.put('/decline/:tradeId',  requireAuth, declineTrade);
router.put('/cancel/:tradeId',   requireAuth, cancelTrade);

module.exports = router;
