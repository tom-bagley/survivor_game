const express = require('express');
const router = express.Router();
const { getAllSurvivors, getHistoricalPrices, getCurrentSeason } = require('../controllers/survivorControllers')

router.get('/allplayers', getAllSurvivors);
router.get('/:name', getHistoricalPrices);
router.get('/getcurrentseason', getCurrentSeason);

module.exports = router;