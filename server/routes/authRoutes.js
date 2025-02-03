const express = require('express');
const router = express.Router();
const { test, registerUser, loginUser, getProfile, } = require('../controllers/authControllers')






router.get('/', (req, res) => {
    res.send('Auth Route Working!');
});
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getProfile);

module.exports = router;