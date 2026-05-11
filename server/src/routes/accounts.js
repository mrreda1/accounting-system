const express = require('express');
const router = express.Router();
const {
  getAccount,
  getLedgerInfo,
  addAccount,
  getAccounts,
  updateAccountStatus,
} = require('./../controllers/accounts');

router.get('/:code', getAccount);
router.get('/:code/ledger', getLedgerInfo);
router.patch('/:code/status', updateAccountStatus);
router.route('/').post(addAccount).get(getAccounts);

module.exports = router;
