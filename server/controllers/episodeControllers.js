const Episode = require('../models/episodeSettings');
const User = require('../models/user');

const fetchOnAirStatus = async (req, res) => {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    const onAirStatus = episode.onAir;
    return res.json(onAirStatus);
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

const toggleOnAirStatus = async (req, res) => {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (!episode) {
      return res.json({ error: 'episode_settings document not found' });
    }

    episode.onAir = !episode.onAir;

    if (episode.onAir) {
      episode.episodeEndTime = new Date(Date.now() + 3 * 60 * 1000);
    } else {
      episode.episodeEndTime = null;
    }

    await episode.save();

    return res.json({ 
      onAir: episode.onAir, 
      episodeEndTime: episode.episodeEndTime 
    });
  } catch (error) {
    console.error(error);
    return res.json({ error: 'Failed to toggle on-air status' });
  }
};

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
    fetchOnAirStatus,
    toggleOnAirStatus,
    fetchEpisodeEndTime,
    changeLastSeenEpisode
}