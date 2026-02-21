const express = require('express');
const router = express.Router();
const cors = require('cors');
const { updatePortfolio, getPortfolio, getPrices, getProfile, updatePortfolioPreseason, saveBootOrder } = require('../controllers/transactionControllers')


router.put('/updateportfolio', updatePortfolio)
router.get('/getportfolio', getPortfolio)
router.get('/getprices', getPrices)
router.get('/getprofile', getProfile)
router.put('/updateportfoliopreseason', updatePortfolioPreseason)
router.put('/save-boot-order', saveBootOrder)


module.exports = router;