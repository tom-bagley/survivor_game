const express = require('express');
const router = express.Router();
const { addSurvivor, getAllSurvivors, deleteSurvivor, toggleSurvivorAvailability } = require('../controllers/survivorControllers')
const { resetUsers, changeSeason, changeWeek, getCurrentSeason, updatePlayerEvent, applyChallengeBatch, setFinalist, awardFinalistBonuses, applyLiveIdolBonus, toggleOnAirStatus, toggleTribalCouncil } = require('../controllers/adminControllers')
const { requireAuth, requireAdmin } = require('../authMiddleware/authMiddleware')

router.get('/getcurrentseason', getCurrentSeason);
router.post('/addplayer', requireAuth, requireAdmin, addSurvivor)
router.get('/allplayers', requireAuth, requireAdmin, getAllSurvivors);
router.delete('/deleteplayer/:id', requireAuth, requireAdmin, deleteSurvivor);
router.patch('/changeavailability/:id', requireAuth, requireAdmin, toggleSurvivorAvailability);
router.post('/reset-users', requireAuth, requireAdmin, resetUsers);
router.post('/change-season', requireAuth, requireAdmin, changeSeason);
router.post('/change-week', requireAuth, requireAdmin, changeWeek);
router.patch('/player/events', requireAuth, requireAdmin, updatePlayerEvent);
router.patch('/challenge/batch', requireAuth, requireAdmin, applyChallengeBatch);
router.patch('/finalists/set', requireAuth, requireAdmin, setFinalist);
router.post('/finalists/award', requireAuth, requireAdmin, awardFinalistBonuses);
router.post('/apply-live-idol-bonus', requireAuth, requireAdmin, applyLiveIdolBonus);
router.patch('/changeonairstatus', requireAuth, requireAdmin, toggleOnAirStatus);
router.patch('/changetribalcouncil', requireAuth, requireAdmin, toggleTribalCouncil);

module.exports = router;