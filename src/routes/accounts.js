const { getAccount, getLedgerInfo } = require('./../controllers/accounts');
const express = require('express');
const router = express.Router();

router.get('/:code', getAccount);
router.get('/:code/ledger', getLedgerInfo)

module.exports = router;
