const episodeSettings = require('../models/episodeSettings');
const User = require('../models/user');

const fetchOnAirStatus = async (req, res) => {
  try {
    const currentSettings = await episodeSettings.findById("episode_settings")
    const onAirStatus = currentSettings.onAir;
    return res.json(onAirStatus);
  } catch (error) {
    return res.json({error: 'Failed to fetch on air status'})
  }
}

const fetchEpisodeEndTime = async (req, res) => {
    try {
        const currentSettings = await episodeSettings.findById("episode_settings")
        const endTime = currentSettings.episodeEndTime;
        return res.json(endTime)
    } catch (error) {
        return res.json({error: 'Failed to fetch episode end time'})
    }
}

const toggleOnAirStatus = async (req, res) => {
  try {
    const currentSettings = await episodeSettings.findById("episode_settings");
    if (!currentSettings) {
      return res.json({ error: 'episode_settings document not found' });
    }

    currentSettings.onAir = !currentSettings.onAir;

    if (currentSettings.onAir) {
      currentSettings.episodeEndTime = new Date(Date.now() + 3 * 60 * 1000);
    } else {
      currentSettings.episodeEndTime = null;
    }

    await currentSettings.save();

    return res.json({ 
      onAir: currentSettings.onAir, 
      episodeEndTime: currentSettings.episodeEndTime 
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
    const currentSettings = await episodeSettings.findById("episode_settings");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.last_seen_episode_id = currentSettings.episodeId;
    
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