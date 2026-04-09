const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { authenticate, authorize, validate } = require('../middlewares');
const { user: userValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Static routes must come before /:id to avoid param collision
router.post('/', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(userValidator.createUserSchema), userController.create);
router.get('/', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), userController.findAll);

// Profit Share static routes (Super Admin only) — before /:id
router.get('/admin-profit-summaries', authorize(ROLES.SUPER_ADMIN), userController.getAdminProfitSummaries);
router.put('/profit-payment/:paymentId', authorize(ROLES.SUPER_ADMIN), userController.updateProfitPayment);
router.delete('/profit-payment/:paymentId', authorize(ROLES.SUPER_ADMIN), userController.deleteProfitPayment);

// Parameterised routes
router.get('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), userController.findById);
router.put('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(userValidator.updateUserSchema), userController.update);
router.patch('/:id/toggle-status', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), userController.toggleStatus);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN), userController.remove);
router.patch('/:id/profit-share', authorize(ROLES.SUPER_ADMIN), userController.updateProfitShare);
router.post('/:id/profit-payment', authorize(ROLES.SUPER_ADMIN), userController.makeProfitPayment);
router.get('/:id/profit-summary', authorize(ROLES.SUPER_ADMIN), userController.getProfitSummary);
router.get('/:id/profit-payments', authorize(ROLES.SUPER_ADMIN), userController.getProfitPayments);

module.exports = router;
