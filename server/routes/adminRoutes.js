const express = require('express');
const router = express.Router();
const { addPlayer, getAllPlayers, deletePlayer, togglePlayerAvailability } = require('../controllers/playerControllers')
const { resetUsers, changeSeason, changeWeek, getCurrentSeason } = require('../controllers/adminControllers')
const { requireAuth, requireAdmin } = require('../authMiddleware/authMiddleware')

router.get('/getcurrentseason', requireAuth, requireAdmin, getCurrentSeason);
router.post('/addplayer', requireAuth, requireAdmin, addPlayer)
router.get('/allplayers', requireAuth, requireAdmin, getAllPlayers);
router.delete('/deleteplayer/:id', requireAuth, requireAdmin, deletePlayer);
router.patch('/changeavailability/:id', requireAuth, requireAdmin, togglePlayerAvailability);
router.post('/reset-users', requireAuth, requireAdmin, resetUsers);
router.post('/change-season', requireAuth, requireAdmin, changeSeason);
router.post('/change-week', requireAuth, requireAdmin, changeWeek)
router.post('/set-season-mode', requireAdmin);
router.post('/reset-season', requireAdmin);
router.post('/toggle-safe-mode', requireAdmin);

module.exports = router;