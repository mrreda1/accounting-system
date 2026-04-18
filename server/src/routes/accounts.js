const express = require('express');
const router = express.Router();
const {
  getAccount,
  getLedgerInfo,
  addAccount,
} = require('./../controllers/accounts');

router.get('/:code', getAccount);
router.get('/:code/ledger', getLedgerInfo);
router.post('/', addAccount);

module.exports = router;
