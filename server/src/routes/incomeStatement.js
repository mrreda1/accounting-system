const { getIncomeStatement } = require('./../controllers/incomeStatement');
const express = require('express');
const router = express.Router();

router.get('/', getIncomeStatement);

module.exports = router;
