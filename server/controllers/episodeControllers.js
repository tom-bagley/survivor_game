const Episode = require('../models/episodeSettings');
const User = require('../models/user');

const fetchCurrentEpisodeStats = async (req, res) => {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    return res.json(episode);
  } catch (error) {
    return res.json({error: 'Failed to fetch on air status'})
  }
}

const fetchEpisodeEndTime = async (req, res) => {
    try {
        const episode = await Episode.findOne({ isCurrentEpisode: true });
        const endTime = episode.episodeEndTime;
        return res.json(endTime)
    } catch (error) {
        return res.json({error: 'Failed to fetch episode end time'})
    }
}

const changeLastSeenEpisode = async (req, res) => {
  const {id} = req.params;
  try {
    const user = await User.findById(id); 
    const episode = await Episode.findOne({ isCurrentEpisode: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.last_seen_episode_id = episode.episodeNumber;
    
    await user.save();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}



module.exports = {
    fetchCurrentEpisodeStats,
    fetchEpisodeEndTime,
    changeLastSeenEpisode
}