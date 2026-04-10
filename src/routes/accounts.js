const { getAccount } = require('./../controllers/accounts');
const express = require('express');
const router = express.Router();

router.get('/:code', getAccount);

module.exports = router;
