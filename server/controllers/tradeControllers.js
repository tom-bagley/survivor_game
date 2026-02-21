const Trade = require('../models/trade');
const Group = require('../models/groups');
const UserGroupGame = require('../models/userGroupGame');
const User = require('../models/user');

// POST /trades/send
const sendOffer = async (req, res) => {
  try {
    const { senderId, recipientId, groupId, offerMoney = 0, offerStocks = [], requestMoney = 0, requestStocks = [] } = req.body;

    if (!senderId || !recipientId || !groupId) {
      return res.status(400).json({ error: 'senderId, recipientId, and groupId are required' });
    }

    if (senderId === recipientId) {
      return res.status(400).json({ error: 'You cannot trade with yourself' });
    }

    // Load group and verify membership
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (group.name.startsWith('solo_')) {
      return res.status(400).json({ error: 'Cannot trade in a solo group' });
    }

    const senderMember = group.members.find(m => m.user.toString() === senderId.toString() && m.accepted);
    const recipientMember = group.members.find(m => m.user.toString() === recipientId.toString() && m.accepted);

    if (!senderMember) return res.status(403).json({ error: 'You are not an accepted member of this group' });
    if (!recipientMember) return res.status(400).json({ error: 'Recipient is not an accepted member of this group' });

    // Validate offer is non-empty
    const hasOffer = offerMoney > 0 || (offerStocks.length > 0 && offerStocks.some(s => s.amount > 0));
    const hasRequest = requestMoney > 0 || (requestStocks.length > 0 && requestStocks.some(s => s.amount > 0));
    if (!hasOffer && !hasRequest) {
      return res.status(400).json({ error: 'Trade offer cannot be completely empty' });
    }

    // Load sender's game state
    const senderGame = await UserGroupGame.findOne({ userId: senderId, groupId });
    if (!senderGame) return res.status(404).json({ error: 'Sender game data not found' });

    // Validate sender has enough money
    if (offerMoney > 0 && senderGame.budget < offerMoney) {
      return res.status(400).json({ error: `Insufficient budget. You have $${senderGame.budget.toFixed(2)}` });
    }

    // Validate sender has enough stocks
    for (const { survivorName, amount } of offerStocks) {
      if (!amount || amount <= 0) continue;
      const owned = senderGame.portfolio.get(survivorName) || 0;
      if (owned < amount) {
        return res.status(400).json({ error: `You only own ${owned} share(s) of ${survivorName}` });
      }
    }

    // Get sender name
    const senderUser = await User.findById(senderId, 'name');
    if (!senderUser) return res.status(404).json({ error: 'Sender not found' });

    // Filter out zero-amount stock entries
    const filteredOfferStocks = offerStocks.filter(s => s.amount > 0);
    const filteredRequestStocks = requestStocks.filter(s => s.amount > 0);

    const trade = await Trade.create({
      groupId,
      senderId,
      recipientId,
      senderName: senderUser.name,
      offerMoney,
      offerStocks: filteredOfferStocks,
      requestMoney,
      requestStocks: filteredRequestStocks,
    });

    res.status(201).json({ message: 'Trade offer sent', trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /trades/pending?userId=&groupId=
const getPendingIncoming = async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    if (!userId || !groupId) return res.status(400).json({ error: 'userId and groupId required' });

    const trades = await Trade.find({ recipientId: userId, groupId, status: 'pending' }).sort({ createdAt: 1 });
    res.status(200).json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /trades/sent?userId=&groupId=
const getSentTrades = async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    if (!userId || !groupId) return res.status(400).json({ error: 'userId and groupId required' });

    const trades = await Trade.find({ senderId: userId, groupId, status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /trades/group-members?groupId=&userId=
const getGroupMembers = async (req, res) => {
  try {
    const { groupId, userId } = req.query;
    if (!groupId || !userId) return res.status(400).json({ error: 'groupId and userId required' });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const otherMemberIds = group.members
      .filter(m => m.accepted && m.user.toString() !== userId.toString())
      .map(m => m.user);

    const users = await User.find({ _id: { $in: otherMemberIds } }, 'name');
    const members = users.map(u => ({ userId: u._id, name: u.name }));

    res.status(200).json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /trades/accept/:tradeId
const acceptTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { userId, groupId } = req.body;

    const trade = await Trade.findById(tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'pending') return res.status(400).json({ error: 'Trade is no longer pending' });
    if (trade.recipientId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the recipient can accept this trade' });
    }

    // Load both game states
    const [senderGame, recipientGame] = await Promise.all([
      UserGroupGame.findOne({ userId: trade.senderId, groupId: trade.groupId }),
      UserGroupGame.findOne({ userId: trade.recipientId, groupId: trade.groupId }),
    ]);

    if (!senderGame) return res.status(400).json({ error: 'Sender game data not found' });
    if (!recipientGame) return res.status(400).json({ error: 'Recipient game data not found' });

    // Re-validate sender still has assets
    if (trade.offerMoney > 0 && senderGame.budget < trade.offerMoney) {
      return res.status(400).json({ error: 'Sender no longer has enough budget for this trade' });
    }
    for (const { survivorName, amount } of trade.offerStocks) {
      const owned = senderGame.portfolio.get(survivorName) || 0;
      if (owned < amount) {
        return res.status(400).json({ error: `Sender no longer has enough ${survivorName} shares` });
      }
    }

    // Validate recipient has assets
    if (trade.requestMoney > 0 && recipientGame.budget < trade.requestMoney) {
      return res.status(400).json({ error: 'You do not have enough budget for this trade' });
    }
    for (const { survivorName, amount } of trade.requestStocks) {
      const owned = recipientGame.portfolio.get(survivorName) || 0;
      if (owned < amount) {
        return res.status(400).json({ error: `You do not have enough ${survivorName} shares` });
      }
    }

    // Apply transfers
    senderGame.budget -= trade.offerMoney;
    senderGame.budget += trade.requestMoney;

    for (const { survivorName, amount } of trade.offerStocks) {
      const current = senderGame.portfolio.get(survivorName) || 0;
      const newVal = current - amount;
      if (newVal <= 0) {
        senderGame.portfolio.delete(survivorName);
      } else {
        senderGame.portfolio.set(survivorName, newVal);
      }
    }
    for (const { survivorName, amount } of trade.requestStocks) {
      const current = senderGame.portfolio.get(survivorName) || 0;
      senderGame.portfolio.set(survivorName, current + amount);
    }

    recipientGame.budget -= trade.requestMoney;
    recipientGame.budget += trade.offerMoney;

    for (const { survivorName, amount } of trade.requestStocks) {
      const current = recipientGame.portfolio.get(survivorName) || 0;
      const newVal = current - amount;
      if (newVal <= 0) {
        recipientGame.portfolio.delete(survivorName);
      } else {
        recipientGame.portfolio.set(survivorName, newVal);
      }
    }
    for (const { survivorName, amount } of trade.offerStocks) {
      const current = recipientGame.portfolio.get(survivorName) || 0;
      recipientGame.portfolio.set(survivorName, current + amount);
    }

    trade.status = 'accepted';

    await Promise.all([senderGame.save(), recipientGame.save(), trade.save()]);

    res.status(200).json({ message: 'Trade accepted', trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /trades/decline/:tradeId
const declineTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { userId } = req.body;

    const trade = await Trade.findById(tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'pending') return res.status(400).json({ error: 'Trade is no longer pending' });
    if (trade.recipientId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the recipient can decline this trade' });
    }

    trade.status = 'declined';
    await trade.save();

    res.status(200).json({ message: 'Trade declined' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /trades/cancel/:tradeId
const cancelTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { userId } = req.body;

    const trade = await Trade.findById(tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'pending') return res.status(400).json({ error: 'Trade is no longer pending' });
    if (trade.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the sender can cancel this trade' });
    }

    trade.status = 'cancelled';
    await trade.save();

    res.status(200).json({ message: 'Trade cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  sendOffer,
  getPendingIncoming,
  getSentTrades,
  getGroupMembers,
  acceptTrade,
  declineTrade,
  cancelTrade,
};
