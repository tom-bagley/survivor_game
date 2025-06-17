const LiveLeaderboardCache = require('../models/liveleaderboard');
const { rawListeners } = require('../models/user');

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await LiveLeaderboardCache.findById("live_leaderboard");
        return res.json(leaderboard);
    } catch (error) {
        console.error(error);
        return res.json({ error: 'Failed to Fetch Leaderboard'})
    }
};

const getUserPlaceOnLeaderboard = async (req, res) => {
    try {
        const {id} = req.params;

        const leaderboard = await LiveLeaderboardCache.findById("live_leaderboard");
        
        const entry = leaderboard.entries.find(player => player.user_id === id);
        if (!entry) {
            return res.status(404).json({ error: 'Player not found in leaderboard'})
        }
        const rank = entry.rank;
        res.json(rank);
    } catch (error) {
        console.error(error);
        return res.json({ error: 'Failed to fetch place on leaderboard'})
    }
}

module.exports = {
    getLeaderboard,
    getUserPlaceOnLeaderboard
}