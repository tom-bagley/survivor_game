const Group = require('../models/groups');
const UserGroupGame = require('../models/userGroupGame');
const User = require('../models/user');

const getGroupMax = (group) => {
    const acceptedCount = group.members.filter(m => m.accepted).length || 1;
    return 50 * acceptedCount;
};

const getUserGroups = async (req, res) => {
    const { userId } = req.query;
    try {
        // Find all groups where user is owner or accepted member
        const groups = await Group.find({
            $or: [
                { owner: userId },
                { members: { $elemMatch: { user: userId, accepted: true } } }
            ]
        });

        // Ensure solo group exists and is included
        const soloName = `solo_${userId}`;
        let soloGroup = groups.find(g => g.name === soloName);
        if (!soloGroup) {
            soloGroup = await Group.findOne({ name: soloName });
            if (!soloGroup) {
                soloGroup = await Group.create({
                    name: soloName,
                    owner: userId,
                    members: [{ user: userId, accepted: true, joinedAt: new Date() }],
                });
            }
            groups.unshift(soloGroup);
        }

        const result = groups.map(g => ({
            _id: g._id,
            name: g.name,
            displayName: g.name === soloName ? 'Solo' : g.name,
            isSolo: g.name === soloName,
            maxSharesPerPlayer: getGroupMax(g),
        }));

        // Solo first, then alphabetical
        result.sort((a, b) => {
            if (a.isSolo) return -1;
            if (b.isSolo) return 1;
            return a.displayName.localeCompare(b.displayName);
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
};

const getGroupStandings = async (req, res) => {
    const { groupId } = req.query;
    try {
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        const acceptedMembers = group.members.filter(m => m.accepted && m.user);
        const userIds = acceptedMembers.map(m => m.user);

        const [users, ugGames] = await Promise.all([
            User.find({ _id: { $in: userIds } }, 'name'),
            UserGroupGame.find({ userId: { $in: userIds }, groupId }).select('userId netWorth'),
        ]);

        const nameMap = {};
        users.forEach(u => { nameMap[String(u._id)] = u.name; });

        const netWorthMap = {};
        ugGames.forEach(g => { netWorthMap[String(g.userId)] = g.netWorth ?? 0; });

        const standings = userIds.map(id => ({
            userId: String(id),
            name: nameMap[String(id)] ?? 'Unknown',
            netWorth: netWorthMap[String(id)] ?? 0,
        }));

        standings.sort((a, b) => b.netWorth - a.netWorth);
        standings.forEach((s, i) => { s.rank = i + 1; });

        res.json(standings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getUserGroups, getGroupStandings };
