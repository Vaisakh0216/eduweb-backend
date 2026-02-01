const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { authenticate, authorize, validate } = require('../middlewares');
const { user: userValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Super Admin and Admin only
router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(userValidator.createUserSchema),
  userController.create
);

router.get(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  userController.findAll
);

router.get(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  userController.findById
);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(userValidator.updateUserSchema),
  userController.update
);

router.patch(
  '/:id/toggle-status',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  userController.toggleStatus
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN),
  userController.remove
);

module.exports = router;
