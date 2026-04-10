const { addTransaction } = require('./../controllers/transactions')
const express = require('express');
const router = express.Router();

router.post('/', addTransaction);

module.exports = router;
