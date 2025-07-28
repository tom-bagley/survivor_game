const episodeSettings = require('../models/episodeSettings');

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
      currentSettings.episodeEndTime = new Date(Date.now() + 3 * 60 * 60 * 1000);
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

module.exports = {
    fetchOnAirStatus,
    toggleOnAirStatus,
    fetchEpisodeEndTime
}