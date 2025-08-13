const { changeWeek } = require('../controllers/adminControllers');
const Episode = require('../models/episodeSettings');

async function startEpisodeAuto() {
  await changeWeek()
  const episode = await Episode.findOne({ isCurrentEpisode: true });
  if (episode?.onAir) return; // already on

  episode.onAir = true;
  episode.episodeEndTime = new Date(Date.now() + 3 * 60 * 1000);
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

module.exports = checkEpisodeStatus, startEpisodeAuto, isWednesday8PMEastern;