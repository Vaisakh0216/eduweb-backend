const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/branches', require('./branch.routes'));
router.use('/colleges', require('./college.routes'));
router.use('/courses', require('./course.routes'));
router.use('/agents', require('./agent.routes'));
router.use('/admissions', require('./admission.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/agent-payments', require('./agentPayment.routes'));
router.use('/vouchers', require('./voucher.routes'));
router.use('/daybook', require('./daybook.routes'));
router.use('/cashbook', require('./cashbook.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
