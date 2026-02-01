const express = require('express');
const router = express.Router();
const { admissionController } = require('../controllers');
const {
  authenticate,
  validate,
  filterByBranch,
  checkBranchAccess,
  hideServiceChargeForStaff,
} = require('../middlewares');
const { admission: admissionValidator } = require('../validators');

router.use(authenticate);

router.post(
  '/',
  checkBranchAccess('branchId'),
  validate(admissionValidator.createAdmissionSchema),
  admissionController.create
);

router.get(
  '/',
  filterByBranch,
  hideServiceChargeForStaff,
  admissionController.findAll
);

router.get(
  '/:id',
  hideServiceChargeForStaff,
  admissionController.findById
);

router.get(
  '/:id/details',
  admissionController.getAdmissionDetails
);

// Recalculate payment summary
router.post(
  '/:id/recalculate',
  admissionController.recalculateSummary
);

router.put(
  '/:id',
  validate(admissionValidator.updateAdmissionSchema),
  admissionController.update
);

router.delete(
  '/:id',
  admissionController.remove
);

module.exports = router;
