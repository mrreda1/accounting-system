const { addTransaction, getTransactions } = require('./../controllers/transactions')
const express = require('express');
const router = express.Router();

router.post('/', addTransaction);
router.get('/', getTransactions);

module.exports = router;
