const LiveLeaderboardCache = require('../models/liveleaderboard');
const Group = require("../models/groups");
const User = require('../models/user');
const UserGroupGame = require('../models/userGroupGame');
const Episode = require('../models/episodeSettings');
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
    const token = req.query.inviteToken;
    const group = await Group.findOne({ inviteTokenHash: token})
    const groupName = group.name
    const owner_id = group.owner
    const owner = await User.findOne({ _id: owner_id})
    res.json({ success: true, groupName: groupName, owner: owner.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

const addToGroup = async (req, res) => {
  const { email, token } = req.body;
  try {
    const group = await Group.findOne({ inviteTokenHash: token})
    const user = await User.findOne({ email });
    const alreadyMember = group.members.some(
      (m) => m.user.toString() === user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ error: 'User is already in the group' });
    }
    group.members.push({
      user: user._id,
      accepted: true,
      joinedAt: new Date()
    });
    await group.save()
    return res.json({ success: true, group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

const fetchUserGroups = async (req, res) => {
  const { id } = req.query;

  try {
    const currentEpisode = await Episode.findOne({ isCurrentEpisode: true });
    const episodeKey = String((currentEpisode?.episodeNumber ?? 1) - 1);

    const groups = await Group.find({
      members: { $elemMatch: { user: id, accepted: true } }
    })
    .select("name members maxPossibleBudgets")
    .populate("members.user", "name email");

    const enrichedGroups = await Promise.all(groups.map(async (group) => {
      const maxPossibleBudget = group.maxPossibleBudgets?.get(episodeKey) ?? null;

      const memberNetWorths = await Promise.all(
        group.members
          .filter(m => m.accepted && m.user)
          .map(async (m) => {
            const ugGame = await UserGroupGame.findOne({
              userId: m.user._id,
              groupId: group._id,
            }).select("netWorth");
            return { userId: String(m.user._id), netWorth: ugGame?.netWorth ?? null };
          })
      );

      const netWorthMap = {};
      memberNetWorths.forEach(({ userId, netWorth }) => { netWorthMap[userId] = netWorth; });

      return {
        _id: group._id,
        name: group.name,
        maxPossibleBudget,
        members: group.members.map(m => ({
          _id: m._id,
          user: m.user,
          accepted: m.accepted,
          netWorth: m.user ? (netWorthMap[String(m.user._id)] ?? null) : null,
        })),
      };
    }));

    return res.json({ success: true, groups: enrichedGroups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
    getLeaderboard,
    getUserPlaceOnLeaderboard,
    createGroup,
    fetchGroupName,
    addToGroup,
    fetchUserGroups
}