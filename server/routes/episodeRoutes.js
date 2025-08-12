const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../authMiddleware/authMiddleware')
const { fetchOnAirStatus, toggleOnAirStatus, fetchEpisodeEndTime, changeLastSeenEpisode } = require('../controllers/episodeControllers')

router.get('/onair-status', fetchOnAirStatus);
router.get('/episode-end-time', fetchEpisodeEndTime)
router.patch('/changeonairstatus', requireAuth, requireAdmin, toggleOnAirStatus);
router.put('/updatelastseenepisode/:id', changeLastSeenEpisode);

module.exports = router;