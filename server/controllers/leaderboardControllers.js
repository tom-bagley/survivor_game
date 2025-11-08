const LiveLeaderboardCache = require('../models/liveleaderboard');
const Group = require("../models/groups"); 
const User = require('../models/user');
const crypto = require('node:crypto');
const { rawListeners } = require('../models/user');
const { sendGroupInviteEmail } = require('../resend/email');

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await LiveLeaderboardCache.findById("live_leaderboard");
        return res.json(leaderboard);
    } catch (error) {
        console.error(error);
        return res.json({ error: 'Failed to Fetch Leaderboard'})
    }
};

// GET /leaderboard/getleaderboard/:id
const getUserPlaceOnLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing user id param" });
    }

    const leaderboard = await LiveLeaderboardCache.findById("live_leaderboard").lean();

    if (!leaderboard || !Array.isArray(leaderboard.entries)) {
      return res.status(200).json({ rank: null });
    }

    const entry = leaderboard.entries.find(
      (p) => String(p.user_id) === String(id)
    );

    return res.status(200).json({ rank: entry ? entry.rank : null });
  } catch (error) {
    console.error("getUserPlaceOnLeaderboard error:", error);
    return res.status(500).json({ error: "Failed to fetch place on leaderboard" });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, currentUserId, emails } = req.body; 

    const existing = await Group.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Group name already taken" });
    }

    const rawToken = crypto.randomBytes(24).toString('base64url'); 
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); 
    
    const group = new Group({
      name,
      owner: currentUserId,
      members: [{user: currentUserId, accepted: true, joinedAt: new Date()}],
      inviteTokenHash: tokenHash, 
      inviteTokenExpiresAt: tokenExpiry
    });

    await group.save();

    const populatedGroup = await group.populate("members", "name netWorth");

    for (const email of emails){
      await sendGroupInviteEmail(email, `http://localhost:5173/join-group?token=${tokenHash}`);
    }
    

    res.status(201).json(populatedGroup);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchGroupName = async (req, res) => {
  try{
    const token = req.query.token;
    const group = await Group.findOne({ inviteTokenHash: token})
    groupName = group.name
    res.json({ success: true, groupName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
    getLeaderboard,
    getUserPlaceOnLeaderboard,
    createGroup,
    fetchGroupName
}