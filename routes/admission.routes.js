const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { admissionController } = require('../controllers');
const {
  authenticate,
  validate,
  filterByBranch,
  checkBranchAccess,
  hideServiceChargeForStaff,
} = require('../middlewares');
const { admission: admissionValidator } = require('../validators');

const uploadDir = path.join(__dirname, '../uploads/admissions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

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

// Document upload routes (no auth needed for serving files)
router.get(
  '/:id/documents/:documentId',
  admissionController.getDocument
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
