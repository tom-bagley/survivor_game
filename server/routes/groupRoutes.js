const express = require('express');
const router = express.Router();
const { getUserGroups } = require('../controllers/groupControllers');

router.get('/user-groups', getUserGroups);

module.exports = router;
