const Daybook = require('../models/Daybook');
const Voucher = require('../models/Voucher');
const Branch = require('../models/Branch');
const Cashbook = require('../models/Cashbook');
const AppError = require('../utils/AppError');
const {
  getPaginationOptions,
  formatPaginationResponse,
  buildDateRangeFilter,
  cleanObject,
  generateVoucherNumber,
} = require('../utils/helpers');

class DaybookService {
  async create(data, createdBy) {
    // Get branch for voucher generation
    const branch = await Branch.findById(data.branchId);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }

    // Generate voucher
    const voucherNo = await generateVoucherNumber(branch.code, Voucher);
    const voucherType = data.type === 'income' ? 'receipt' : 'payment';

    const voucher = await Voucher.create({
      voucherNo,
      branchId: data.branchId,
      voucherDate: data.date || new Date(),
      voucherType,
      referenceType: 'Daybook',
      amount: data.amount,
      paymentMode: data.paymentMode || 'Cash',
      description: data.description,
      partyName: data.partyName || '',
      partyType: data.type === 'income' ? 'Income' : 'Expense',
      createdBy,
    });

    // Create daybook entry with voucher reference
    const entry = await Daybook.create({
      ...data,
      date: data.date || new Date(),
      voucherId: voucher._id,
      createdBy,
    });

    // Update voucher with daybook reference
    voucher.referenceId = entry._id;
    await voucher.save();

    // If cash payment, update cashbook
    if (data.paymentMode === 'Cash' || !data.paymentMode) {
      const lastEntry = await Cashbook.findOne({ branchId: data.branchId })
        .sort({ date: -1, createdAt: -1 });

      const credited = data.type === 'income' ? data.amount : 0;
      const debited = data.type === 'expense' ? data.amount : 0;
      const runningBalance = (lastEntry?.runningBalance || 0) + credited - debited;

      await Cashbook.create({
        date: data.date || new Date(),
        branchId: data.branchId,
        category: data.category,
        description: data.description,
        credited,
        debited,
        runningBalance,
        voucherId: voucher._id,
        createdBy,
      });
    }

    return entry.populate([
      { path: 'branchId', select: 'name code' },
      { path: 'admissionId', select: 'admissionNo student.firstName student.lastName' },
      { path: 'voucherId', select: 'voucherNo' },
    ]);
  }

  async findAll(query, branchFilter) {
    const { page, limit, skip } = getPaginationOptions(query);
    let filter = { ...branchFilter };

    // Filter by branch
    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    // Filter by category
    if (query.category) {
      filter.category = query.category;
    }

    // Filter by type
    if (query.type) {
      filter.type = query.type;
    }

    // Date range filter
    const dateFilter = buildDateRangeFilter(
      query.startDate,
      query.endDate,
      'date'
    );
    filter = { ...filter, ...dateFilter };

    const [entries, total] = await Promise.all([
      Daybook.find(filter)
        .populate('branchId', 'name code')
        .populate('admissionId', 'admissionNo student.firstName student.lastName')
        .populate('voucherId', 'voucherNo')
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Daybook.countDocuments(filter),
    ]);

    return formatPaginationResponse(entries, total, page, limit);
  }

  async getSummary(query, branchFilter) {
    let matchFilter = { isDeleted: false, ...branchFilter };

    if (query.branchId) {
      matchFilter.branchId = require('mongoose').Types.ObjectId.createFromHexString(query.branchId);
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      matchFilter.date = {};
      if (query.startDate) {
        matchFilter.date.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.date.$lte = end;
      }
    }

    const summary = await Daybook.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      incomeCount: 0,
      expenseCount: 0,
    };

    summary.forEach((item) => {
      if (item._id === 'income') {
        result.totalIncome = item.total;
        result.incomeCount = item.count;
      } else if (item._id === 'expense') {
        result.totalExpense = item.total;
        result.expenseCount = item.count;
      }
    });

    result.netProfit = result.totalIncome - result.totalExpense;

    return result;
  }

  async getCategoryBreakdown(query, branchFilter) {
    let matchFilter = { isDeleted: false, ...branchFilter };

    if (query.branchId) {
      matchFilter.branchId = require('mongoose').Types.ObjectId.createFromHexString(query.branchId);
    }

    if (query.startDate || query.endDate) {
      matchFilter.date = {};
      if (query.startDate) {
        matchFilter.date.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.date.$lte = end;
      }
    }

    return Daybook.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);
  }

  async findById(id) {
    const entry = await Daybook.findById(id)
      .populate('branchId', 'name code')
      .populate('admissionId', 'admissionNo student.firstName student.lastName')
      .populate('voucherId', 'voucherNo')
      .populate('createdBy', 'firstName lastName');

    if (!entry) {
      throw new AppError('Daybook entry not found', 404);
    }

    return entry;
  }

  async update(id, data, updatedBy) {
    const entry = await Daybook.findById(id);

    if (!entry) {
      throw new AppError('Daybook entry not found', 404);
    }

    Object.assign(entry, cleanObject(data));
    entry.updatedBy = updatedBy;
    await entry.save();

    return entry.populate([
      { path: 'branchId', select: 'name code' },
    ]);
  }

  async delete(id, deletedBy) {
    const entry = await Daybook.findById(id);

    if (!entry) {
      throw new AppError('Daybook entry not found', 404);
    }

    entry.isDeleted = true;
    entry.deletedAt = new Date();
    entry.deletedBy = deletedBy;
    await entry.save();

    return true;
  }

  async exportToCSV(query, branchFilter) {
    let filter = { ...branchFilter };

    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.type) {
      filter.type = query.type;
    }

    const dateFilter = buildDateRangeFilter(
      query.startDate,
      query.endDate,
      'date'
    );
    filter = { ...filter, ...dateFilter };

    const entries = await Daybook.find(filter)
      .populate('branchId', 'name code')
      .populate('admissionId', 'admissionNo')
      .populate('voucherId', 'voucherNo')
      .sort({ date: -1 });

    const csvData = entries.map((entry) => ({
      Date: entry.date.toISOString().split('T')[0],
      Branch: entry.branchId?.name || '',
      Category: entry.category,
      Type: entry.type,
      Amount: entry.amount,
      DueAmount: entry.dueAmount || 0,
      Description: entry.description || '',
      AdmissionNo: entry.admissionId?.admissionNo || '',
      VoucherNo: entry.voucherId?.voucherNo || '',
      Remarks: entry.remarks || '',
    }));

    return csvData;
  }
}

module.exports = new DaybookService();
