const express = require('express');
const router = express.Router();
const { addPlayer, getAllPlayers, deletePlayer, togglePlayerAvailability } = require('../controllers/playerControllers')


router.post('/addplayer', addPlayer);
router.get('/allplayers', getAllPlayers);
router.delete('/deleteplayer/:id', deletePlayer)
router.patch('/changeavailability/:id', togglePlayerAvailability)

module.exports = router;