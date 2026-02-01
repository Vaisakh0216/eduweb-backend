const express = require('express');
const router = express.Router();
const { collegeController } = require('../controllers');
const { authenticate, authorize, validate } = require('../middlewares');
const { college: collegeValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Get active colleges (all authenticated users)
router.get('/active', collegeController.findAllActive);

router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(collegeValidator.createCollegeSchema),
  collegeController.create
);

router.get('/', collegeController.findAll);

router.get('/:id', collegeController.findById);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(collegeValidator.updateCollegeSchema),
  collegeController.update
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  collegeController.remove
);

module.exports = router;
