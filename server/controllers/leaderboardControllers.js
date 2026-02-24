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
    const { name, currentUserId, emails, inviteUserUsername } = req.body; 

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

    const creator = await User.findById(currentUserId);

    const filteredEmails = emails.filter(
      email => email.toLowerCase() !== creator.email.toLowerCase()
    );

    const baseUrl = process.env.CLIENT_URL;

    await Promise.all(
      filteredEmails.map((email) =>
        sendGroupInviteEmail(
          email,
          `${baseUrl}/join-group?token=${rawToken}`,
          inviteUserUsername
        )
      )
    );
    

    res.status(201).json(populatedGroup);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchGroupName = async (req, res) => {
  try {
    const rawToken = req.query.inviteToken;

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const group = await Group.findOne({ inviteTokenHash: tokenHash });

    if (!group) {
      return res.status(404).json({ success: false, message: "Invalid invite link" });
    }

    const owner = await User.findById(group.owner);

    res.json({
      success: true,
      groupName: group.name,
      owner: owner.name,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addToGroup = async (req, res) => {
  const { email, token } = req.body;
  try {

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const group = await Group.findOne({ inviteTokenHash: tokenHash });
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
        owner: group.owner,
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

const leaveGroup = async (req, res) => {
  const { groupId, userId } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.name.startsWith('solo_')) return res.status(400).json({ error: 'Cannot leave solo group' });

    const memberIndex = group.members.findIndex(m => String(m.user) === String(userId));
    if (memberIndex === -1) return res.status(400).json({ error: 'Not a member of this group' });

    if (String(group.owner) === String(userId)) {
      const otherAccepted = group.members.filter(m => m.accepted && String(m.user) !== String(userId));
      if (otherAccepted.length > 0) {
        return res.status(400).json({ error: 'Group owner cannot leave while other members remain' });
      }
      await Group.findByIdAndDelete(groupId);
      return res.json({ success: true, deleted: true });
    }

    group.members.splice(memberIndex, 1);
    await group.save();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

const getSoloLeaderboard = async (req, res) => {
  try {
    const { userId } = req.query;

    // All solo groups (one member each)
    const soloGroups = await Group.find({ name: /^solo_/ }).select('_id members').lean();

    const entries = (
      await Promise.all(
        soloGroups.map(async (group) => {
          const member = group.members.find((m) => m.accepted);
          if (!member) return null;

          const [ugGame, user] = await Promise.all([
            UserGroupGame.findOne({ userId: member.user, groupId: group._id }).select('netWorth').lean(),
            User.findById(member.user).select('name isGuest').lean(),
          ]);

          if (!ugGame || !user || user.isGuest) return null;

          return {
            userId: String(member.user),
            username: user.name,
            netWorth: ugGame.netWorth ?? 0,
          };
        })
      )
    )
      .filter(Boolean)
      .sort((a, b) => b.netWorth - a.netWorth)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    const topTen = entries.slice(0, 10);

    let myEntry = null;
    if (userId) {
      const found = entries.find((e) => e.userId === String(userId));
      if (found && found.rank > 10) myEntry = found;
    }

    return res.json({ topTen, myEntry });
  } catch (error) {
    console.error('getSoloLeaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch solo leaderboard' });
  }
};

module.exports = {
    getLeaderboard,
    getUserPlaceOnLeaderboard,
    getSoloLeaderboard,
    createGroup,
    fetchGroupName,
    addToGroup,
    fetchUserGroups,
    leaveGroup
}