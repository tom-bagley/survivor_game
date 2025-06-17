const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserPlaceOnLeaderboard } = require('../controllers/leaderboardControllers')

router.get('/getleaderboard', getLeaderboard);
router.get('/getleaderboard/:id', getUserPlaceOnLeaderboard)

module.exports = router;