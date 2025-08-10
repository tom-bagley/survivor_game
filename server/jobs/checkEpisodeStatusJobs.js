const { changeWeek } = require('../controllers/adminControllers');
const episodeSettings = require('../models/liveleaderboard');

async function startEpisodeAuto() {
  const currentSettings = await episodeSettings.findById("episode_settings");
  if (currentSettings?.onAir) return; // already on

  currentSettings.onAir = true;
  currentSettings.episodeEndTime = new Date(Date.now() + 3 * 60 * 60 * 1000);
  await currentSettings.save();

  await changeWeek()
  console.log("Episode automatically started for Wednesday 8PM Eastern");
}

async function checkEpisodeStatus() {
  try {
    const settings = await episodeSettings.findById("episode_settings");
    if (settings?.onAir && settings.episodeEndTime) {
      if (new Date() >= settings.episodeEndTime) {
        settings.onAir = false;
        settings.episodeEndTime = null;
        await settings.save();
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