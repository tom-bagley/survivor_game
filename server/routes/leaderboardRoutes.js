const express = require('express');
const router = express.Router();
const { getLeaderboard, getUserPlaceOnLeaderboard, getSoloLeaderboard, createGroup, fetchGroupName, addToGroup, fetchUserGroups, leaveGroup } = require('../controllers/leaderboardControllers')

router.get('/getleaderboard', getLeaderboard);
router.get('/getleaderboard/:id', getUserPlaceOnLeaderboard);
router.get('/solo-top10', getSoloLeaderboard);
router.post('/creategroup', createGroup)
router.get('/fetchGroupName', fetchGroupName)
router.put('/addToGroup', addToGroup)
router.get('/fetchusergroups', fetchUserGroups)
router.delete('/leavegroup', leaveGroup)

module.exports = router;