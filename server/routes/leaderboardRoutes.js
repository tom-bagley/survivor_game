const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardControllers')

router.get('/getleaderboard', getLeaderboard);

module.exports = router;