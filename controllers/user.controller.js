const userService = require('../services/user.service');
const dashboardService = require('../services/dashboard.service');

const create = async (req, res, next) => {
  try {
    const user = await userService.create(req.validatedBody, req.user._id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const result = await userService.findAll(req.query, req.user);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.update(
      req.params.id,
      req.validatedBody,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const user = await userService.toggleStatus(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await userService.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getAdminProfitSummaries = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super admin only' });
    }
    const summaries = await userService.getAdminProfitSummaries();
    res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    next(error);
  }
};

const updateProfitShare = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super admin only' });
    }
    const { percentage } = req.body;
    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res.status(400).json({ success: false, message: 'Percentage must be between 0 and 100' });
    }
    const user = await userService.updateProfitShare(req.params.id, percentage, req.user._id);
    res.status(200).json({ success: true, message: 'Profit share updated', data: user });
  } catch (error) {
    next(error);
  }
};

const makeProfitPayment = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super admin only' });
    }
    const payment = await userService.makeProfitPayment(req.params.id, req.body, req.user._id);
    res.status(201).json({ success: true, message: 'Profit payment recorded', data: payment });
  } catch (error) {
    next(error);
  }
};

const getProfitSummary = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super admin only' });
    }
    const targetUser = await userService.findById(req.params.id);
    // Compute net profit for admin's branches
    const branchIds = targetUser.branches?.map(b => b._id) || [];
    const branchFilter = branchIds.length ? { branchId: { $in: branchIds } } : {};
    const financial = await dashboardService.getFinancialBreakdown(branchFilter, null, null);
    const netProfit = financial.businessProfit.netProfit;
    const summary = await userService.getProfitSummary(req.params.id, netProfit);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

const getProfitPayments = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super admin only' });
    }
    const payments = await userService.getProfitPayments(req.params.id);
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const updateProfitPayment = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ success: false, message: 'Super admin only' });
    const payment = await userService.updateProfitPayment(req.params.paymentId, req.body, req.user._id);
    res.status(200).json({ success: true, message: 'Payment updated', data: payment });
  } catch (error) { next(error); }
};

const deleteProfitPayment = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ success: false, message: 'Super admin only' });
    await userService.deleteProfitPayment(req.params.paymentId);
    res.status(200).json({ success: true, message: 'Payment deleted' });
  } catch (error) { next(error); }
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  toggleStatus,
  remove,
  getAdminProfitSummaries,
  updateProfitShare,
  makeProfitPayment,
  getProfitSummary,
  getProfitPayments,
  updateProfitPayment,
  deleteProfitPayment,
};
