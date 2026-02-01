const express = require('express');
const router = express.Router();
const { agentController } = require('../controllers');
const { authenticate, authorize, validate } = require('../middlewares');
const { agent: agentValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Get active agents (all authenticated users)
router.get('/active', agentController.findAllActive);

router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(agentValidator.createAgentSchema),
  agentController.create
);

router.get('/', agentController.findAll);

router.get('/:id', agentController.findById);

router.get('/:id/details', agentController.getAgentDetails);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(agentValidator.updateAgentSchema),
  agentController.update
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  agentController.remove
);

module.exports = router;
