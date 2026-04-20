const express = require('express');
const router = express.Router();
const {
  getAccount,
  getLedgerInfo,
  addAccount,
  getAccounts,
} = require('./../controllers/accounts');

router.get('/:code', getAccount);
router.get('/:code/ledger', getLedgerInfo);
router.route('/').post(addAccount).get(getAccounts);

module.exports = router;
