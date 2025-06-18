const express = require('express');
const router = express.Router();
const { addPlayer, getAllPlayers, deletePlayer, togglePlayerAvailability, getHistoricalPrices, getCurrentSeason } = require('../controllers/playerControllers')


router.post('/addplayer', addPlayer);
router.get('/allplayers', getAllPlayers);
router.delete('/deleteplayer/:id', deletePlayer)
router.patch('/changeavailability/:id', togglePlayerAvailability)
router.get('/:name', getHistoricalPrices);
router.get('/getcurrentseason', getCurrentSeason);

module.exports = router;