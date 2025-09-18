const Episode = require('../models/episodeSettings');
const { DateTime } = require('luxon');

async function startEpisode() {
  const episode = await Episode.findOne({ isCurrentEpisode: true });
  if (episode?.onAir) return; // already on

  episode.onAir = true;
  episode.episodeEndTime = new Date(Date.now() + (3 * 60 * 60 * 1000) + (30 * 60 * 1000));
  await episode.save();
  console.log("Episode automatically started for Wednesday 8PM Eastern");
}

async function checkEpisodeStatus() {
  try {
    const episode = await Episode.findOne({ isCurrentEpisode: true });
    if (episode?.onAir && episode.episodeEndTime) {
      if (new Date() >= episode.episodeEndTime) {
        episode.onAir = false;
        episode.episodeEndTime = null;
        await episode.save();
        console.log("Episode automatically turned OFF — time limit reached");
      }
    }
  } catch (err) {
    console.error("Episode status check error:", err);
  }
}

function isWednesday8PMEastern() {
  const nowEastern = DateTime.now().setZone("America/New_York");
  return nowEastern.weekday === 3 && nowEastern.hour === 20 && nowEastern.minute === 0;
}

module.exports = { checkEpisodeStatus, startEpisode, isWednesday8PMEastern };