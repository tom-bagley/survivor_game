const express = require('express');
const router = express.Router();
const cors = require('cors');
const { updatePortfolio, getPortfolio, getPrices, updatePortfolioPreseason } = require('../controllers/transactionControllers')

//middleware
router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:5173'
    })
)

router.put('/updateportfolio', updatePortfolio)
router.get('/getportfolio', getPortfolio)
router.get('/getprices', getPrices)
router.put('/updateportfoliopreseason', updatePortfolioPreseason)


module.exports = router;