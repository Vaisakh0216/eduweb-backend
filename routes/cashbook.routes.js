const express = require('express');
const router = express.Router();
const { cashbookController } = require('../controllers');
const {
  authenticate,
  authorize,
  validate,
  filterByBranch,
  checkBranchAccess,
} = require('../middlewares');
const { cashbook: cashbookValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Static routes MUST come before parameterized routes
router.get(
  '/summary',
  filterByBranch,
  cashbookController.getSummary
);

router.get(
  '/balance/:branchId',
  cashbookController.getBalance
);

// Clear all cashbook entries (soft delete)
router.delete(
  '/clear',
  authorize(ROLES.SUPER_ADMIN),
  cashbookController.clearAll
);

// Hard clear all cashbook entries (permanent delete) - USE WITH CAUTION
router.delete(
  '/hard-clear',
  authorize(ROLES.SUPER_ADMIN),
  cashbookController.hardClearAll
);

// CRUD routes with :id parameter MUST come after all static routes
router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  checkBranchAccess('branchId'),
  validate(cashbookValidator.createCashbookSchema),
  cashbookController.create
);

router.get(
  '/',
  filterByBranch,
  cashbookController.findAll
);

// Parameterized routes at the end
router.get(
  '/:id',
  cashbookController.findById
);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(cashbookValidator.updateCashbookSchema),
  cashbookController.update
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  cashbookController.remove
);

module.exports = router;
