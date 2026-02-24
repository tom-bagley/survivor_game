const express = require('express');
const router = express.Router();
const { getUserGroups, getGroupStandings } = require('../controllers/groupControllers');

router.get('/user-groups', getUserGroups);
router.get('/standings', getGroupStandings);

module.exports = router;
