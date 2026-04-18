const { getTrialBalance } = require('./../controllers/trialBalance');
const express = require('express');
const router = express.Router();

router.get('/', getTrialBalance);

module.exports = router;
