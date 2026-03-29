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
    const academicYear = query.academicYear || null;

    const [
      financialBreakdown,
      admissionStats,
      paymentPending,
      serviceChargePending,
      agentPaymentPending,
      cashBalance,
      bankBalance,
      serviceRevenueSummary,
      consultantCommissionSummary,
    ] = await Promise.all([
      this.getFinancialBreakdown(branchFilter, dateFilter, academicYear),
      this.getAdmissionStats(branchFilter, dateFilter, academicYear),
      this.getPaymentPending(branchFilter, academicYear),
      this.getServiceChargePending(branchFilter, user.role, academicYear),
      this.getAgentPaymentPending(branchFilter, academicYear),
      this.getCashBalance(branchFilter, query.branchId),
      this.getBankBalance(branchFilter, query.branchId),
      this.getServiceRevenueSummary(branchFilter, dateFilter, academicYear),
      this.getConsultantCommissionSummary(branchFilter, dateFilter, academicYear),
    ]);

    return {
      financial: financialBreakdown,
      admissions: admissionStats,
      pending: {
        studentPayments: paymentPending,
        serviceCharge: user.role !== ROLES.STAFF ? serviceChargePending : null,
        agentPayments: agentPaymentPending,
      },
      cashInHand: cashBalance,
      cashInBank: bankBalance,
      serviceRevenue: serviceRevenueSummary,
      consultantCommission: consultantCommissionSummary,
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

  async getFinancialBreakdown(branchFilter, dateFilter, academicYear) {
    // Payment-based filters (paymentDate field)
    const paymentMatch = { isDeleted: false, ...branchFilter };
    if (dateFilter) paymentMatch.paymentDate = dateFilter;

    // Daybook-based filters (date field)
    const daybookMatch = { isDeleted: false, ...branchFilter };
    if (dateFilter) daybookMatch.date = dateFilter;

    // When academic year is selected, scope payment-linked queries to that year's admissions
    if (academicYear) {
      const admissionIds = await Admission.distinct('_id', {
        isDeleted: false,
        ...branchFilter,
        academicYear,
      });
      paymentMatch.admissionId = { $in: admissionIds };
      daybookMatch.admissionId = { $in: admissionIds };
    }

    // Operating expense categories — regular business costs, excludes college/agent payouts
    const operatingExpenseCategories = [
      'electricity_bill', 'water_bill', 'office_rent', 'salary', 'misc',
      'wifi_phone_bill', 'recharge', 'food_refreshment', 'stationery', 'printing',
      'maintenance', 'advertisement_marketing', 'college_visit', 'field_work',
      'data_collection', 'agent_commission', 'sub_agent_commission', 'donation', 'paid_to_agent',
    ];

    // Legacy AgentPayment filter (uses paymentDate, branchId)
    const agentPaymentMatch = { isDeleted: false, ...branchFilter };
    if (dateFilter) agentPaymentMatch.paymentDate = dateFilter;
    if (academicYear && paymentMatch.admissionId) agentPaymentMatch.admissionId = paymentMatch.admissionId;

    const [serviceRevenueResult, feeIncomeResult, opExpResult, feePaidResult, legacyAgentPayResult] = await Promise.all([
      // Service Revenue = sum of serviceChargeDeducted from all payments
      // (covers SC-only, mixed, and college-paid SC payments)
      Payment.aggregate([
        { $match: paymentMatch },
        { $group: { _id: null, total: { $sum: '$serviceChargeDeducted' } } },
      ]),

      // Fee Income = sum of amountDueToCollege from all payments
      Payment.aggregate([
        { $match: paymentMatch },
        { $group: { _id: null, total: { $sum: '$amountDueToCollege' } } },
      ]),

      // Operating Expenses = petty cash and running costs from daybook
      Daybook.aggregate([
        { $match: { ...daybookMatch, category: { $in: operatingExpenseCategories } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Fee Paid to College = paid_to_college daybook entries
      Daybook.aggregate([
        { $match: { ...daybookMatch, category: 'paid_to_college' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Legacy AgentPayment records (cash paid by consultancy to agents — not reflected in Daybook)
      AgentPayment.aggregate([
        { $match: agentPaymentMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const serviceRevenue = serviceRevenueResult[0]?.total || 0;
    const feeIncome = feeIncomeResult[0]?.total || 0;
    const daybookExpenses = opExpResult[0]?.total || 0;
    const feePaidToCollege = feePaidResult[0]?.total || 0;
    const legacyAgentPaid = legacyAgentPayResult[0]?.total || 0;
    // operatingExpenses = daybook costs (already includes paid_to_agent via Payment service)
    //                    + legacy AgentPayment records that bypass Daybook
    const operatingExpenses = daybookExpenses + legacyAgentPaid;

    return {
      businessProfit: {
        serviceRevenue,
        operatingExpenses,
        netProfit: serviceRevenue - operatingExpenses,
      },
      feeManagement: {
        feeIncome,
        feePaidToCollege,
        balancePayableToCollege: feeIncome - feePaidToCollege,
      },
    };
  }

  async getAdmissionStats(branchFilter, dateFilter, academicYear) {
    const matchFilter = { isDeleted: false, ...branchFilter };
    if (dateFilter) matchFilter.admissionDate = dateFilter;
    if (academicYear) matchFilter.academicYear = academicYear;

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

  async getPaymentPending(branchFilter, academicYear) {
    const matchFilter = { isDeleted: false, ...branchFilter };
    if (academicYear) matchFilter.academicYear = academicYear;

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

  async getServiceChargePending(branchFilter, userRole, academicYear) {
    if (userRole === ROLES.STAFF) return null;

    const matchFilter = { isDeleted: false, ...branchFilter };
    if (academicYear) matchFilter.academicYear = academicYear;

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

  async getAgentPaymentPending(branchFilter, academicYear) {
    const matchFilter = { isDeleted: false, ...branchFilter };
    if (academicYear) matchFilter.academicYear = academicYear;

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

    const bankIncomeCategories = [
      'received_from_student',
      'received_from_college_service_charge',
      'service_charge_income',
    ];

    // Get bank transactions from daybook (non-cash payments)
    const bankTransactions = await Daybook.aggregate([
      {
        $match: {
          ...matchFilter,
          paymentMode: { $in: ['UPI', 'BankTransfer', 'Card', 'Cheque'] }
        }
      },
      {
        $addFields: {
          computedType: {
            $cond: {
              if: { $ifNull: ['$transactionType', false] },
              then: '$transactionType',
              else: {
                $cond: {
                  if: { $in: ['$category', bankIncomeCategories] },
                  then: 'income',
                  else: 'expense',
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$computedType',
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

    if (query.academicYear) {
      const admissionIds = await Admission.distinct('_id', {
        isDeleted: false,
        ...branchFilter,
        academicYear: query.academicYear,
      });
      matchFilter.admissionId = { $in: admissionIds };
    }

    const incomeCategories = [
      'received_from_student',
      'received_from_college_service_charge',
      'service_charge_income',
    ];

    const trend = await Daybook.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          computedType: {
            $cond: {
              if: { $ifNull: ['$transactionType', false] },
              then: '$transactionType',
              else: {
                $cond: {
                  if: { $in: ['$category', incomeCategories] },
                  then: 'income',
                  else: 'expense',
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$computedType',
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
    if (query.academicYear) matchFilter.academicYear = query.academicYear;

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

  async getServiceRevenueSummary(branchFilter, dateFilter, academicYear) {
    const matchFilter = { isDeleted: false, ...branchFilter };
    if (dateFilter) matchFilter.admissionDate = dateFilter;
    if (academicYear) matchFilter.academicYear = academicYear;

    const result = await Admission.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$serviceCharge.agreed', 0] } },
          received: { $sum: { $ifNull: ['$serviceCharge.received', 0] } },
          pending: { $sum: { $ifNull: ['$serviceCharge.due', 0] } },
        },
      },
    ]);

    return {
      total: result[0]?.total || 0,
      received: result[0]?.received || 0,
      pending: result[0]?.pending || 0,
    };
  }

  async getConsultantCommissionSummary(branchFilter, dateFilter, academicYear) {
    const matchFilter = { isDeleted: false, ...branchFilter };
    if (dateFilter) matchFilter.admissionDate = dateFilter;
    if (academicYear) matchFilter.academicYear = academicYear;

    const result = await Admission.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: [
                { $ifNull: ['$agents.totalAgentFee', 0] },
                { $ifNull: ['$agent.agentFee', 0] },
              ],
            },
          },
          paid: { $sum: { $ifNull: ['$paymentSummary.agentPaid', 0] } },
        },
      },
    ]);

    const total = result[0]?.total || 0;
    const paid = result[0]?.paid || 0;

    return {
      total,
      paid,
      payable: Math.max(0, total - paid),
    };
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
