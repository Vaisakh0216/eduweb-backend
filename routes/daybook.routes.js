const express = require('express');
const router = express.Router();
const { daybookController } = require('../controllers');
const {
  authenticate,
  authorize,
  validate,
  filterByBranch,
  checkBranchAccess,
} = require('../middlewares');
const { daybook: daybookValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get(
  '/summary',
  filterByBranch,
  daybookController.getSummary
);

router.get(
  '/category-breakdown',
  filterByBranch,
  daybookController.getCategoryBreakdown
);

router.get(
  '/export',
  filterByBranch,
  daybookController.exportCSV
);

router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  checkBranchAccess('branchId'),
  validate(daybookValidator.createDaybookSchema),
  daybookController.create
);

router.get(
  '/',
  filterByBranch,
  daybookController.findAll
);

router.get(
  '/:id',
  daybookController.findById
);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(daybookValidator.updateDaybookSchema),
  daybookController.update
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  daybookController.remove
);

module.exports = router;
