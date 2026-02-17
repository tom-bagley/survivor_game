const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserPlaceOnLeaderboard, createGroup, fetchGroupName, addToGroup, fetchUserGroups } = require('../controllers/leaderboardControllers')

router.get('/getleaderboard', getLeaderboard);
router.get('/getleaderboard/:id', getUserPlaceOnLeaderboard)
router.post('/creategroup', createGroup)
router.get('/fetchGroupName', fetchGroupName)
router.put('/addToGroup', addToGroup)
router.get('/fetchusergroups', fetchUserGroups)

module.exports = router;