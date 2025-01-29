const express = require('express');
const router = express.Router();
const cors = require('cors');
const { test, registerUser, loginUser, getProfile, addPlayer, getAllPlayers, deletePlayer, updatePortfolio } = require('../controllers/authControllers')

//middleware
router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:5173'
    })
)

router.get('/', test);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getProfile);
router.post('/addplayer', addPlayer);
router.get('/allplayers', getAllPlayers);
router.delete('/deleteplayer/:id', deletePlayer)
router.put('/updateportfolio', updatePortfolio)


module.exports = router;