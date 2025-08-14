const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../authMiddleware/authMiddleware')
const { fetchCurrentEpisodeStats, fetchEpisodeEndTime, changeLastSeenEpisode } = require('../controllers/episodeControllers')

router.get('/getcurrentepisode', fetchCurrentEpisodeStats);
router.get('/episode-end-time', fetchEpisodeEndTime)
router.put('/updatelastseenepisode/:id', changeLastSeenEpisode);

module.exports = router;