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
const { createS3Upload } = require('../utils/s3');

const upload = createS3Upload('daybook');

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
  '/opening-balance',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  daybookController.setOpeningBalance
);

router.get(
  '/opening-balance/:branchId',
  daybookController.getOpeningBalance
);

router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF),
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
  '/petty-cash',
  filterByBranch,
  daybookController.getPettyCashData
);

router.get(
  '/:id',
  daybookController.findById
);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF),
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
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF),
  upload.single('file'),
  daybookController.addAttachment
);

router.delete(
  '/:id/attachments/:attachmentId',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  daybookController.removeAttachment
);

module.exports = router;
