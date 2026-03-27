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
const { createS3Upload } = require('../utils/s3');

const upload = createS3Upload('admissions', 10 * 1024 * 1024);

// Public — browser opens this directly (window.open), no JWT available
router.get('/:id/documents/:documentId', admissionController.getDocument);

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

router.post(
  '/:id/documents',
  upload.single('file'),
  admissionController.addDocument
);

router.delete(
  '/:id/documents/:documentId',
  admissionController.removeDocument
);

module.exports = router;
