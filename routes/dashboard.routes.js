const express = require('express');
const router = express.Router();
const { dashboardController } = require('../controllers');
const { authenticate } = require('../middlewares');

router.use(authenticate);

router.get('/stats', dashboardController.getStats);
router.get('/monthly-trend', dashboardController.getMonthlyTrend);
router.get('/admission-trend', dashboardController.getAdmissionTrend);
router.get('/payment-trend', dashboardController.getPaymentTrend);

module.exports = router;
