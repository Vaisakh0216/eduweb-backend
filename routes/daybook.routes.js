const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

const uploadDir = path.join(__dirname, '../uploads/daybook');
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
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get(
  '/:id/attachments/:attachmentId',
  daybookController.getAttachment
);

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
  '/clear',
  authorize(ROLES.SUPER_ADMIN),
  daybookController.clearAll
);

router.delete(
  '/hard-clear',
  authorize(ROLES.SUPER_ADMIN),
  daybookController.hardClearAll
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  daybookController.remove
);

router.post(
  '/:id/attachments',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  upload.single('file'),
  daybookController.addAttachment
);

router.delete(
  '/:id/attachments/:attachmentId',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  daybookController.removeAttachment
);

module.exports = router;
