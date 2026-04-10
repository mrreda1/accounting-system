const { getBalanceSheet } = require('./../controllers/balanceSheet');
const express = require('express');
const router = express.Router();

router.get('/', getBalanceSheet);

module.exports = router;
