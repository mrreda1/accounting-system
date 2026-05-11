const {
	addTransaction,
	getTransactions,
	deleteTransaction,
} = require('./../controllers/transactions');
const express = require('express');
const router = express.Router();

router.get('/', getTransactions);
router.post('/', addTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
