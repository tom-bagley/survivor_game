const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserPlaceOnLeaderboard, createGroup } = require('../controllers/leaderboardControllers')

router.get('/getleaderboard', getLeaderboard);
router.get('/getleaderboard/:id', getUserPlaceOnLeaderboard)
router.post('/creategroup', createGroup)

module.exports = router;