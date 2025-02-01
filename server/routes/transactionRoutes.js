const express = require('express');
const router = express.Router();
const cors = require('cors');
const { updatePortfolio, getPortfolio, getPrices, updatePortfolioPreseason, getProfile } = require('../controllers/transactionControllers')

//middleware
router.use(
    cors({
        credentials: true,
        origin: 'https://survivorstockgame.onrender.com'
    })
)

router.put('/updateportfolio', updatePortfolio)
router.get('/getportfolio', getPortfolio)
router.get('/getprices', getPrices)
router.get('/getprofile', getProfile)
router.put('/updateportfoliopreseason', updatePortfolioPreseason)


module.exports = router;