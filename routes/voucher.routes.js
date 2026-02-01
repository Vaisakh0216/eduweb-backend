const express = require('express');
const router = express.Router();
const { voucherController } = require('../controllers');
const { authenticate, filterByBranch } = require('../middlewares');

router.use(authenticate);

router.get(
  '/',
  filterByBranch,
  voucherController.findAll
);

router.get(
  '/number/:voucherNo',
  voucherController.findByVoucherNo
);

router.get(
  '/:id',
  voucherController.findById
);

router.post(
  '/:id/print',
  voucherController.recordPrint
);

module.exports = router;
