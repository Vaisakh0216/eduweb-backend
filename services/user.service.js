const User = require('../models/User');
const ProfitPayment = require('../models/ProfitPayment');
const AppError = require('../utils/AppError');
const { getPaginationOptions, formatPaginationResponse, cleanObject } = require('../utils/helpers');
const { ROLES } = require('../utils/constants');

class UserService {
  async create(data, createdBy) {
    // Check if email exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    const user = await User.create({
      ...data,
      createdBy,
    });

    return user;
  }

  async findAll(query, currentUser) {
    const { page, limit, skip } = getPaginationOptions(query);
    const filter = { isActive: true };

    // Search
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by role
    if (query.role) {
      filter.role = query.role;
    }

    // Filter by status
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    // Non-super admin can only see users from their branches
    if (currentUser.role !== ROLES.SUPER_ADMIN) {
      filter.branches = { $in: currentUser.branches.map((b) => b._id) };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('branches', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return formatPaginationResponse(users, total, page, limit);
  }

  async findById(id) {
    const user = await User.findById(id)
      .populate('branches', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async update(id, data, updatedBy) {
    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check email uniqueness if changing
    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new AppError('Email already exists', 400);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...cleanObject(data), updatedBy },
      { new: true, runValidators: true }
    ).populate('branches', 'name code');

    return updatedUser;
  }

  async toggleStatus(id, updatedBy) {
    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = !user.isActive;
    user.updatedBy = updatedBy;
    await user.save();

    return user;
  }

  async delete(id) {
    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      throw new AppError('Cannot delete super admin', 400);
    }

    await User.findByIdAndDelete(id);
    return true;
  }

  async updateProfitShare(id, percentage, updatedBy) {
    const user = await User.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role !== ROLES.ADMIN) throw new AppError('Profit share is only applicable for admin users', 400);

    user.profitShare = { percentage };
    user.updatedBy = updatedBy;
    await user.save();
    return user;
  }

  async makeProfitPayment(id, data, createdBy) {
    const user = await User.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role !== ROLES.ADMIN) throw new AppError('Profit payments are only for admin users', 400);

    const payment = await ProfitPayment.create({
      userId: id,
      amount: data.amount,
      paymentDate: data.paymentDate || new Date(),
      paymentMode: data.paymentMode || 'Cash',
      notes: data.notes,
      createdBy,
    });

    // Denormalise totalPaid on user so table can display it without extra queries
    await User.findByIdAndUpdate(id, { $inc: { 'profitShare.totalPaid': data.amount } });

    return payment;
  }

  async getProfitSummary(id, netProfit) {
    const user = await User.findById(id);
    if (!user) throw new AppError('User not found', 404);

    const percentage = user.profitShare?.percentage || 0;
    const earned = Math.round((netProfit * percentage) / 100);

    const paidResult = await ProfitPayment.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const totalPaid = paidResult[0]?.total || 0;
    const paymentCount = paidResult[0]?.count || 0;
    const due = Math.max(0, earned - totalPaid);

    const recentPayments = await ProfitPayment.find({ userId: id })
      .sort({ paymentDate: -1 })
      .limit(10)
      .populate('createdBy', 'firstName lastName');

    return { percentage, earned, totalPaid, due, paymentCount, recentPayments };
  }

  async getProfitPayments(id) {
    return ProfitPayment.find({ userId: id })
      .sort({ paymentDate: -1 })
      .populate('createdBy', 'firstName lastName');
  }

  async updateProfitPayment(paymentId, data, updatedBy) {
    const payment = await ProfitPayment.findById(paymentId);
    if (!payment) throw new AppError('Payment not found', 404);
    const oldAmount = payment.amount;
    const newAmount = data.amount !== undefined ? Number(data.amount) : oldAmount;
    Object.assign(payment, { ...data, amount: newAmount, updatedBy });
    await payment.save();
    // Sync totalPaid on user
    const diff = newAmount - oldAmount;
    if (diff !== 0) {
      await User.findByIdAndUpdate(payment.userId, { $inc: { 'profitShare.totalPaid': diff } });
    }
    return payment;
  }

  async deleteProfitPayment(paymentId) {
    const payment = await ProfitPayment.findById(paymentId);
    if (!payment) throw new AppError('Payment not found', 404);
    await payment.deleteOne();
    await User.findByIdAndUpdate(payment.userId, { $inc: { 'profitShare.totalPaid': -payment.amount } });
    return true;
  }

  async getAdminProfitSummaries() {
    const DashboardService = require('./dashboard.service');
    const admins = await User.find({ role: ROLES.ADMIN, isActive: true })
      .populate('branches', '_id');

    const summaries = await Promise.all(
      admins.map(async (admin) => {
        const branchIds = admin.branches?.map(b => b._id) || [];
        const branchFilter = branchIds.length ? { branchId: { $in: branchIds } } : {};
        const financial = await DashboardService.getFinancialBreakdown(branchFilter, null, null);
        const netProfit = financial.businessProfit.netProfit;
        const percentage = admin.profitShare?.percentage || 0;
        const earned = Math.max(0, Math.round((netProfit * percentage) / 100));
        const totalPaid = admin.profitShare?.totalPaid || 0;
        return {
          userId: admin._id,
          earned,
          totalPaid,
          due: Math.max(0, earned - totalPaid),
        };
      })
    );

    return Object.fromEntries(summaries.map(s => [s.userId.toString(), s]));
  }
}

module.exports = new UserService();
