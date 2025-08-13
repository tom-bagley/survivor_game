const express = require('express');
const router = express.Router();
const { addSurvivor, getAllSurvivors, deleteSurvivor, toggleSurvivorAvailability, getHistoricalPrices, getCurrentSeason } = require('../controllers/survivorControllers')


router.post('/addplayer', addSurvivor);
router.get('/allplayers', getAllSurvivors);
router.delete('/deleteplayer/:id', deleteSurvivor);
router.patch('/changeavailability/:id', toggleSurvivorAvailability);
router.get('/:name', getHistoricalPrices);
router.get('/getcurrentseason', getCurrentSeason);

module.exports = router;