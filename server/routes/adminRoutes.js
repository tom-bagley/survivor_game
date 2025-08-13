const express = require('express');
const router = express.Router();
const { addSurvivor, getAllSurvivors, deleteSurvivor, toggleSurvivorAvailability } = require('../controllers/survivorControllers')
const { resetUsers, changeSeason, changeWeek, getCurrentSeason } = require('../controllers/adminControllers')
const { requireAuth, requireAdmin } = require('../authMiddleware/authMiddleware')

router.get('/getcurrentseason', getCurrentSeason);
router.post('/addplayer', requireAuth, requireAdmin, addSurvivor)
router.get('/allplayers', requireAuth, requireAdmin, getAllSurvivors);
router.delete('/deleteplayer/:id', requireAuth, requireAdmin, deleteSurvivor);
router.patch('/changeavailability/:id', requireAuth, requireAdmin, toggleSurvivorAvailability);
router.post('/reset-users', requireAuth, requireAdmin, resetUsers);
router.post('/change-season', requireAuth, requireAdmin, changeSeason);
router.post('/change-week', requireAuth, requireAdmin, changeWeek);

module.exports = router;