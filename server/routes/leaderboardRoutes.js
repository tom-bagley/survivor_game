const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserPlaceOnLeaderboard, createGroup, fetchGroupName } = require('../controllers/leaderboardControllers')

router.get('/getleaderboard', getLeaderboard);
router.get('/getleaderboard/:id', getUserPlaceOnLeaderboard)
router.post('/creategroup', createGroup)
router.get('/fetchGroupName', fetchGroupName)

module.exports = router;