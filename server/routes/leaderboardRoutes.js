const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserPlaceOnLeaderboard, createGroup, fetchGroupName, addToGroup } = require('../controllers/leaderboardControllers')

router.get('/getleaderboard', getLeaderboard);
router.get('/getleaderboard/:id', getUserPlaceOnLeaderboard)
router.post('/creategroup', createGroup)
router.get('/fetchGroupName', fetchGroupName)
router.put('/addToGroup', addToGroup)

module.exports = router;