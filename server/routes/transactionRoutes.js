const express = require('express');
const router = express.Router();
const cors = require('cors');
const { updatePortfolio, getPortfolio, getPrices, getProfile, updatePortfolioPreseason } = require('../controllers/transactionControllers')


router.put('/updateportfolio', updatePortfolio)
router.get('/getportfolio', getPortfolio)
router.get('/getprices', getPrices)
router.get('/getprofile', getProfile)
router.put('/updateportfoliopreseason', updatePortfolioPreseason)


module.exports = router;