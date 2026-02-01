const mongoose = require('mongoose');
const Admission = require('../models/Admission');
const Payment = require('../models/Payment');
const AgentPayment = require('../models/AgentPayment');
const Daybook = require('../models/Daybook');
const Cashbook = require('../models/Cashbook');
const { ADMISSION_STATUS, ROLES } = require('../utils/constants');

class DashboardService {
  async getDashboardStats(query, user) {
    const branchFilter = this.buildBranchFilter(query, user);
    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);

    const [
      financialSummary,
      admissionStats,
      paymentPending,
      serviceChargePending,
      agentPaymentPending,
      cashBalance,
      bankBalance,
    ] = await Promise.all([
      this.getFinancialSummary(branchFilter, dateFilter),
      this.getAdmissionStats(branchFilter, dateFilter),
      this.getPaymentPending(branchFilter),
      this.getServiceChargePending(branchFilter, user.role),
      this.getAgentPaymentPending(branchFilter),
      this.getCashBalance(branchFilter, query.branchId),
      this.getBankBalance(branchFilter, query.branchId),
    ]);

    return {
      financial: financialSummary,
      admissions: admissionStats,
      pending: {
        studentPayments: paymentPending,
        serviceCharge: user.role !== ROLES.STAFF ? serviceChargePending : null,
        agentPayments: agentPaymentPending,
      },
      cashInHand: cashBalance,
      cashInBank: bankBalance,
    };
  }

  buildBranchFilter(query, user) {
    if (user.role === ROLES.SUPER_ADMIN) {
      return query.branchId ? { branchId: new mongoose.Types.ObjectId(query.branchId) } : {};
    }

    const userBranchIds = user.branches.map((b) => b._id);
    if (query.branchId && userBranchIds.some((id) => id.toString() === query.branchId)) {
      return { branchId: new mongoose.Types.ObjectId(query.branchId) };
    }

    return { branchId: { $in: userBranchIds } };
  }

  buildDateFilter(startDate, endDate) {
    const filter = {};
    if (startDate) {
      filter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.$lte = end;
    }
    return Object.keys(filter).length > 0 ? filter : null;
  }

  async getFinancialSummary(branchFilter, dateFilter) {
    const matchFilter = { isDeleted: false, ...branchFilter };
    if (dateFilter) {
      matchFilter.date = dateFilter;
    }

    const summary = await Daybook.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    summary.forEach((item) => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
    });

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
    };
  }

  async getAdmissionStats(branchFilter, dateFilter) {
    const matchFilter = { isDeleted: false, ...branchFilter };
    if (dateFilter) {
      matchFilter.admissionDate = dateFilter;
    }

    const stats = await Admission.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$admissionStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
    };

    stats.forEach((item) => {
      result.total += item.count;
      if (item._id === ADMISSION_STATUS.CONFIRMED) result.confirmed = item.count;
      if (item._id === ADMISSION_STATUS.PENDING) result.pending = item.count;
      if (item._id === ADMISSION_STATUS.CANCELLED) result.cancelled = item.count;
    });

    return result;
  }

  async getPaymentPending(branchFilter) {
    const matchFilter = { isDeleted: false, ...branchFilter };

    const result = await Admission.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$paymentSummary.studentDue' },
          count: {
            $sum: {
              $cond: [{ $gt: ['$paymentSummary.studentDue', 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    return {
      amount: result[0]?.totalDue || 0,
      count: result[0]?.count || 0,
    };
  }

  async getServiceChargePending(branchFilter, userRole) {
    if (userRole === ROLES.STAFF) return null;

    const matchFilter = { isDeleted: false, ...branchFilter };

    const result = await Admission.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$serviceCharge.due' },
          count: {
            $sum: {
              $cond: [{ $gt: ['$serviceCharge.due', 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    return {
      amount: result[0]?.totalDue || 0,
      count: result[0]?.count || 0,
    };
  }

  async getAgentPaymentPending(branchFilter) {
    const matchFilter = { isDeleted: false, ...branchFilter };

    const result = await Admission.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          // Calculate total agent fee from both legacy and multiple agents
          calculatedAgentDue: {
            $max: [
              0,
              {
                $subtract: [
                  {
                    $add: [
                      { $ifNull: ['$agent.agentFee', 0] },
                      { $ifNull: ['$agents.totalAgentFee', 0] }
                    ]
                  },
                  { $ifNull: ['$paymentSummary.agentPaid', 0] }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$calculatedAgentDue' },
          count: {
            $sum: {
              $cond: [{ $gt: ['$calculatedAgentDue', 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    return {
      amount: result[0]?.totalDue || 0,
      count: result[0]?.count || 0,
    };
  }

  async getCashBalance(branchFilter, specificBranchId) {
    if (specificBranchId) {
      const lastEntry = await Cashbook.findOne({
        branchId: specificBranchId,
        isDeleted: false,
      }).sort({ date: -1, createdAt: -1 });

      return lastEntry?.runningBalance || 0;
    }

    // Aggregate cash balance across branches
    const matchFilter = { isDeleted: false };
    if (branchFilter.branchId) {
      if (branchFilter.branchId.$in) {
        matchFilter.branchId = { $in: branchFilter.branchId.$in };
      } else {
        matchFilter.branchId = branchFilter.branchId;
      }
    }

    const latestBalances = await Cashbook.aggregate([
      { $match: matchFilter },
      { $sort: { branchId: 1, date: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$branchId',
          latestBalance: { $first: '$runningBalance' },
        },
      },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$latestBalance' },
        },
      },
    ]);

    return latestBalances[0]?.totalBalance || 0;
  }

  async getBankBalance(branchFilter, specificBranchId) {
    // Bank balance is calculated from non-cash daybook entries
    // Income via bank - Expense via bank
    const matchFilter = { isDeleted: false };
    
    if (specificBranchId) {
      matchFilter.branchId = new mongoose.Types.ObjectId(specificBranchId);
    } else if (branchFilter.branchId) {
      if (branchFilter.branchId.$in) {
        matchFilter.branchId = { $in: branchFilter.branchId.$in };
      } else {
        matchFilter.branchId = branchFilter.branchId;
      }
    }

    // Get bank transactions from daybook (non-cash payments)
    const bankTransactions = await Daybook.aggregate([
      { 
        $match: { 
          ...matchFilter,
          paymentMode: { $in: ['UPI', 'BankTransfer', 'Card', 'Cheque'] }
        } 
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let bankIncome = 0;
    let bankExpense = 0;

    bankTransactions.forEach((item) => {
      if (item._id === 'income') bankIncome = item.total;
      if (item._id === 'expense') bankExpense = item.total;
    });

    // Also add payments received via bank (from Payment collection)
    const paymentBankIncome = await Payment.aggregate([
      {
        $match: {
          isDeleted: false,
          receiverType: 'Consultancy',
          paymentMode: { $in: ['UPI', 'BankTransfer', 'Card', 'Cheque'] },
          ...(specificBranchId ? { branchId: new mongoose.Types.ObjectId(specificBranchId) } : 
              (branchFilter.branchId ? { branchId: branchFilter.branchId } : {}))
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalBankIncome = bankIncome + (paymentBankIncome[0]?.total || 0);
    
    return totalBankIncome - bankExpense;
  }

  async getMonthlyTrend(query, user) {
    const branchFilter = this.buildBranchFilter(query, user);
    const year = query.year || new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const matchFilter = {
      isDeleted: false,
      ...branchFilter,
      date: { $gte: startDate, $lte: endDate },
    };

    const trend = await Daybook.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.month',
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing months
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const found = trend.find((t) => t._id === i);
      months.push({
        month: i,
        monthName: new Date(year, i - 1, 1).toLocaleString('default', { month: 'short' }),
        income: found?.income || 0,
        expense: found?.expense || 0,
        profit: (found?.income || 0) - (found?.expense || 0),
      });
    }

    return months;
  }

  async getAdmissionTrend(query, user) {
    const branchFilter = this.buildBranchFilter(query, user);
    const year = query.year || new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const matchFilter = {
      isDeleted: false,
      ...branchFilter,
      admissionDate: { $gte: startDate, $lte: endDate },
    };

    const trend = await Admission.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            month: { $month: '$admissionDate' },
            status: '$admissionStatus',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.month',
          total: { $sum: '$count' },
          confirmed: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Confirmed'] }, '$count', 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Pending'] }, '$count', 0],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Cancelled'] }, '$count', 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = [];
    for (let i = 1; i <= 12; i++) {
      const found = trend.find((t) => t._id === i);
      months.push({
        month: i,
        monthName: new Date(year, i - 1, 1).toLocaleString('default', { month: 'short' }),
        total: found?.total || 0,
        confirmed: found?.confirmed || 0,
        pending: found?.pending || 0,
        cancelled: found?.cancelled || 0,
      });
    }

    return months;
  }

  async getPaymentTrend(query, user) {
    const branchFilter = this.buildBranchFilter(query, user);
    const year = query.year || new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const matchFilter = {
      isDeleted: false,
      ...branchFilter,
      paymentDate: { $gte: startDate, $lte: endDate },
    };

    const trend = await Payment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = [];
    for (let i = 1; i <= 12; i++) {
      const found = trend.find((t) => t._id === i);
      months.push({
        month: i,
        monthName: new Date(year, i - 1, 1).toLocaleString('default', { month: 'short' }),
        amount: found?.total || 0,
        count: found?.count || 0,
      });
    }

    return months;
  }
}

module.exports = new DashboardService();
