const express = require('express');
const router = express.Router();
const { branchController } = require('../controllers');
const { authenticate, authorize, validate } = require('../middlewares');
const { branch: branchValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Get active branches (all authenticated users)
router.get('/active', branchController.findAllActive);

// Super Admin only for branch management
router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN),
  validate(branchValidator.createBranchSchema),
  branchController.create
);

router.get(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  branchController.findAll
);

router.get(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  branchController.findById
);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN),
  validate(branchValidator.updateBranchSchema),
  branchController.update
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN),
  branchController.remove
);

module.exports = router;
