const express = require('express');
const router = express.Router();
const { agentPaymentController } = require('../controllers');
const {
  authenticate,
  authorize,
  validate,
  filterByBranch,
  checkBranchAccess,
} = require('../middlewares');
const { agentPayment: agentPaymentValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  checkBranchAccess('branchId'),
  validate(agentPaymentValidator.createAgentPaymentSchema),
  agentPaymentController.create
);

router.get(
  '/',
  filterByBranch,
  agentPaymentController.findAll
);

router.get(
  '/:id',
  agentPaymentController.findById
);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(agentPaymentValidator.updateAgentPaymentSchema),
  agentPaymentController.update
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  agentPaymentController.remove
);

module.exports = router;
