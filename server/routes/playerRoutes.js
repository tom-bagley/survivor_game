const express = require('express');
const router = express.Router();
const cors = require('cors');
const { addPlayer, getAllPlayers, deletePlayer, togglePlayerAvailability } = require('../controllers/playerControllers')

//middleware
router.use(
    cors({
        credentials: true,
        origin: 'https://survivorstockgame.onrender.com'
    })
)

router.post('/addplayer', addPlayer);
router.get('/allplayers', getAllPlayers);
router.delete('/deleteplayer/:id', deletePlayer)
router.patch('/changeavailability/:id', togglePlayerAvailability)

module.exports = router;