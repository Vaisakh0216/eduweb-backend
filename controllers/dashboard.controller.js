const dashboardService = require('../services/dashboard.service');

const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.query, req.user);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrend = async (req, res, next) => {
  try {
    const trend = await dashboardService.getMonthlyTrend(req.query, req.user);

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    next(error);
  }
};

const getAdmissionTrend = async (req, res, next) => {
  try {
    const trend = await dashboardService.getAdmissionTrend(req.query, req.user);

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentTrend = async (req, res, next) => {
  try {
    const trend = await dashboardService.getPaymentTrend(req.query, req.user);

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getMonthlyTrend,
  getAdmissionTrend,
  getPaymentTrend,
};
