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


module.exports = {
    getLeaderboard,
    getUserPlaceOnLeaderboard
}