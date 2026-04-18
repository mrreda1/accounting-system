const express = require('express');
const router = express.Router();
const {
  getAccount,
  addAccount,
  getAccounts,
} = require('./../controllers/accounts');

router.get('/:code', getAccount);
router.route('/').post(addAccount).get(getAccounts);

module.exports = router;
