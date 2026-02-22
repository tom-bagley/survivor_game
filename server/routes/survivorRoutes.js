const express = require('express');
const router = express.Router();
const { getAllSurvivors, getCurrentSeason } = require('../controllers/survivorControllers')

router.get('/allplayers', getAllSurvivors);
router.get('/getcurrentseason', getCurrentSeason);

module.exports = router;