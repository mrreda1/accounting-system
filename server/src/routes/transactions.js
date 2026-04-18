const { addTransaction, getTransactions } = require('./../controllers/transactions')
const express = require('express');
const router = express.Router();

router.get('/', getTransactions);
router.post('/', addTransaction);

module.exports = router;
