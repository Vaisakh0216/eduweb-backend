// const Daybook = require('../models/Daybook');
// const Voucher = require('../models/Voucher');
// const Branch = require('../models/Branch');
// const Cashbook = require('../models/Cashbook');
// const AppError = require('../utils/AppError');
// const {
//   getPaginationOptions,
//   formatPaginationResponse,
//   buildDateRangeFilter,
//   cleanObject,
//   generateVoucherNumber,
// } = require('../utils/helpers');

// class DaybookService {
//   async create(data, createdBy) {
//     // Get branch for voucher generation
//     const branch = await Branch.findById(data.branchId);
//     if (!branch) {
//       throw new AppError('Branch not found', 404);
//     }

//     // Generate voucher
//     const voucherNo = await generateVoucherNumber(branch.code, Voucher);
//     const voucherType = data.type === 'income' ? 'receipt' : 'payment';

//     const voucher = await Voucher.create({
//       voucherNo,
//       branchId: data.branchId,
//       voucherDate: data.date || new Date(),
//       voucherType,
//       referenceType: 'Daybook',
//       amount: data.amount,
//       paymentMode: data.paymentMode || 'Cash',
//       description: data.description,
//       partyName: data.partyName || '',
//       partyType: data.type === 'income' ? 'Income' : 'Expense',
//       createdBy,
//     });

//     // Create daybook entry with voucher reference
//     const entry = await Daybook.create({
//       ...data,
//       date: data.date || new Date(),
//       voucherId: voucher._id,
//       createdBy,
//     });

//     // Update voucher with daybook reference
//     voucher.referenceId = entry._id;
//     await voucher.save();

//     // If cash payment, update cashbook
//     if (data.paymentMode === 'Cash' || !data.paymentMode) {
//       const lastEntry = await Cashbook.findOne({ branchId: data.branchId })
//         .sort({ date: -1, createdAt: -1 });

//       const credited = data.type === 'income' ? data.amount : 0;
//       const debited = data.type === 'expense' ? data.amount : 0;
//       const runningBalance = (lastEntry?.runningBalance || 0) + credited - debited;

//       await Cashbook.create({
//         date: data.date || new Date(),
//         branchId: data.branchId,
//         category: data.category,
//         description: data.description,
//         credited,
//         debited,
//         runningBalance,
//         voucherId: voucher._id,
//         createdBy,
//       });
//     }

//     return entry.populate([
//       { path: 'branchId', select: 'name code' },
//       { path: 'admissionId', select: 'admissionNo student.firstName student.lastName' },
//       { path: 'voucherId', select: 'voucherNo' },
//     ]);
//   }

//   async findAll(query, branchFilter) {
//     const { page, limit, skip } = getPaginationOptions(query);
//     let filter = { ...branchFilter };

//     // Filter by branch
//     if (query.branchId) {
//       filter.branchId = query.branchId;
//     }

//     // Filter by category
//     if (query.category) {
//       filter.category = query.category;
//     }

//     // Filter by type
//     if (query.type) {
//       filter.type = query.type;
//     }

//     // Date range filter
//     const dateFilter = buildDateRangeFilter(
//       query.startDate,
//       query.endDate,
//       'date'
//     );
//     filter = { ...filter, ...dateFilter };

//     const [entries, total] = await Promise.all([
//       Daybook.find(filter)
//         .populate('branchId', 'name code')
//         .populate('admissionId', 'admissionNo student.firstName student.lastName')
//         .populate('voucherId', 'voucherNo')
//         .populate('createdBy', 'firstName lastName')
//         .sort({ date: -1, createdAt: -1 })
//         .skip(skip)
//         .limit(limit),
//       Daybook.countDocuments(filter),
//     ]);

//     return formatPaginationResponse(entries, total, page, limit);
//   }

//   async getSummary(query, branchFilter) {
//     let matchFilter = { isDeleted: false, ...branchFilter };

//     if (query.branchId) {
//       matchFilter.branchId = require('mongoose').Types.ObjectId.createFromHexString(query.branchId);
//     }

//     // Date range filter
//     if (query.startDate || query.endDate) {
//       matchFilter.date = {};
//       if (query.startDate) {
//         matchFilter.date.$gte = new Date(query.startDate);
//       }
//       if (query.endDate) {
//         const end = new Date(query.endDate);
//         end.setHours(23, 59, 59, 999);
//         matchFilter.date.$lte = end;
//       }
//     }

//     const summary = await Daybook.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: '$type',
//           total: { $sum: '$amount' },
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     const result = {
//       totalIncome: 0,
//       totalExpense: 0,
//       netProfit: 0,
//       incomeCount: 0,
//       expenseCount: 0,
//     };

//     summary.forEach((item) => {
//       if (item._id === 'income') {
//         result.totalIncome = item.total;
//         result.incomeCount = item.count;
//       } else if (item._id === 'expense') {
//         result.totalExpense = item.total;
//         result.expenseCount = item.count;
//       }
//     });

//     result.netProfit = result.totalIncome - result.totalExpense;

//     return result;
//   }

//   async getCategoryBreakdown(query, branchFilter) {
//     let matchFilter = { isDeleted: false, ...branchFilter };

//     if (query.branchId) {
//       matchFilter.branchId = require('mongoose').Types.ObjectId.createFromHexString(query.branchId);
//     }

//     if (query.startDate || query.endDate) {
//       matchFilter.date = {};
//       if (query.startDate) {
//         matchFilter.date.$gte = new Date(query.startDate);
//       }
//       if (query.endDate) {
//         const end = new Date(query.endDate);
//         end.setHours(23, 59, 59, 999);
//         matchFilter.date.$lte = end;
//       }
//     }

//     return Daybook.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: { category: '$category', type: '$type' },
//           total: { $sum: '$amount' },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { total: -1 },
//       },
//     ]);
//   }

//   async findById(id) {
//     const entry = await Daybook.findById(id)
//       .populate('branchId', 'name code')
//       .populate('admissionId', 'admissionNo student.firstName student.lastName')
//       .populate('voucherId', 'voucherNo')
//       .populate('createdBy', 'firstName lastName');

//     if (!entry) {
//       throw new AppError('Daybook entry not found', 404);
//     }

//     return entry;
//   }

//   async update(id, data, updatedBy) {
//     const entry = await Daybook.findById(id);

//     if (!entry) {
//       throw new AppError('Daybook entry not found', 404);
//     }

//     Object.assign(entry, cleanObject(data));
//     entry.updatedBy = updatedBy;
//     await entry.save();

//     return entry.populate([
//       { path: 'branchId', select: 'name code' },
//     ]);
//   }

//   async delete(id, deletedBy) {
//     const entry = await Daybook.findById(id);

//     if (!entry) {
//       throw new AppError('Daybook entry not found', 404);
//     }

//     entry.isDeleted = true;
//     entry.deletedAt = new Date();
//     entry.deletedBy = deletedBy;
//     await entry.save();

//     return true;
//   }

//   async exportToCSV(query, branchFilter) {
//     let filter = { ...branchFilter };

//     if (query.branchId) {
//       filter.branchId = query.branchId;
//     }

//     if (query.category) {
//       filter.category = query.category;
//     }

//     if (query.type) {
//       filter.type = query.type;
//     }

//     const dateFilter = buildDateRangeFilter(
//       query.startDate,
//       query.endDate,
//       'date'
//     );
//     filter = { ...filter, ...dateFilter };

//     const entries = await Daybook.find(filter)
//       .populate('branchId', 'name code')
//       .populate('admissionId', 'admissionNo')
//       .populate('voucherId', 'voucherNo')
//       .sort({ date: -1 });

//     const csvData = entries.map((entry) => ({
//       Date: entry.date.toISOString().split('T')[0],
//       Branch: entry.branchId?.name || '',
//       Category: entry.category,
//       Type: entry.type,
//       Amount: entry.amount,
//       DueAmount: entry.dueAmount || 0,
//       Description: entry.description || '',
//       AdmissionNo: entry.admissionId?.admissionNo || '',
//       VoucherNo: entry.voucherId?.voucherNo || '',
//       Remarks: entry.remarks || '',
//     }));

//     return csvData;
//   }
// }

// module.exports = new DaybookService();

const Daybook = require("../models/Daybook");
const Voucher = require("../models/Voucher");
const Cashbook = require("../models/Cashbook");
const Branch = require("../models/Branch");
const { DAYBOOK_CATEGORIES_CONFIG } = require("../utils/constants");
const { generateVoucherNumber } = require("../utils/helpers");

class DaybookService {
  async create(data, userId) {
    const entry = await Daybook.create({
      ...data,
      createdBy: userId,
    });

    // Determine type: prefer explicit transactionType, fallback to category config
    const type =
      data.transactionType ||
      DAYBOOK_CATEGORIES_CONFIG[data.category]?.type ||
      "expense";

    // Generate voucher number with retry on duplicate key race condition
    const branch = await Branch.findById(data.branchId);
    if (!branch) throw new Error("Branch not found");

    let voucher;
    let retries = 3;
    while (retries > 0) {
      try {
        const voucherNo = await generateVoucherNumber(branch.code);
        const voucherType = type === "income" ? "receipt" : "payment";
        voucher = await Voucher.create({
          voucherNo,
          branchId: data.branchId,
          voucherType,
          amount: data.amount,
          description: data.description || `Daybook entry - ${data.category}`,
          voucherDate: data.date || new Date(),
          daybookId: entry._id,
          createdBy: userId,
        });
        break;
      } catch (err) {
        if (err.code === 11000 && retries > 1) {
          retries--;
        } else {
          throw err;
        }
      }
    }

    // Update daybook with voucher reference
    entry.voucherId = voucher._id;
    await entry.save();

    // Determine whether to create a cashbook (Cash balance) entry:
    // 1. account=Cash (or unset): normal income/expense — update Cash balance.
    // 2. account=Petty Cash + transactionType=transfer + paymentMode=Cash:
    //    Cash is being moved OUT to Petty Cash — debit Cash balance.
    // 3. account=Petty Cash expenses or Bank entries: no cashbook entry needed.
    const isCashAccount = !data.account || data.account === "Cash";
    const isPettyCashFromCash =
      data.account === "Petty Cash" &&
      data.transactionType === "transfer" &&
      (!data.paymentMode || data.paymentMode === "Cash");

    if (isCashAccount || isPettyCashFromCash) {
      const lastCashEntry = await Cashbook.findOne({ branchId: data.branchId })
        .sort({ date: -1, createdAt: -1 });

      let credited = 0;
      let debited = 0;

      if (isCashAccount) {
        credited = type === "income" ? data.amount : 0;
        debited = type === "expense" ? data.amount : 0;
      } else {
        // Petty Cash transfer from Cash — always a debit from Cash
        debited = data.amount;
      }

      const runningBalance = (lastCashEntry?.runningBalance || 0) + credited - debited;

      await Cashbook.create({
        date: data.date || new Date(),
        branchId: data.branchId,
        category: data.category,
        description: data.description,
        credited,
        debited,
        runningBalance,
        remarks: data.remarks,
        voucherId: voucher._id,
        daybookId: entry._id,
        createdBy: userId,
      });
    }

    return entry;
  }

  async getAll(query = {}, branchFilter = {}) {
    const {
      page = 1,
      limit = 10,
      branchId,
      category,
      startDate,
      endDate,
      search,
      account,
      transactionType,
    } = query;

    // Start with the role-based branch filter (set by filterByBranch middleware)
    const filter = { ...branchFilter };

    // A specific branchId in the query further narrows the filter
    if (branchId) filter.branchId = branchId;
    if (category) filter.category = category;
    if (account) filter.account = account;
    if (transactionType) filter.transactionType = transactionType;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
        { transactionRef: { $regex: search, $options: "i" } },
        { paidTo: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Daybook.find(filter)
        .populate("branchId", "name code")
        .populate("voucherId", "voucherNo")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Daybook.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id) {
    const entry = await Daybook.findById(id)
      .populate("branchId", "name code")
      .populate("voucherId", "voucherNo voucherType")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    if (!entry) {
      throw new Error("Entry not found");
    }

    return entry;
  }

  async update(id, data, userId) {
    const entry = await Daybook.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    )
      .populate("branchId", "name code")
      .populate("voucherId", "voucherNo");

    if (!entry) {
      throw new Error("Entry not found");
    }

    return entry;
  }

  async delete(id, userId) {
    const entry = await Daybook.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
      { new: true }
    );

    if (!entry) {
      throw new Error("Entry not found");
    }

    // Soft delete related voucher and cashbook entries
    if (entry.voucherId) {
      await Voucher.findByIdAndUpdate(entry.voucherId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      });
    }

    await Cashbook.updateMany(
      { daybookId: id },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      }
    );

    return entry;
  }

  async getSummary(query = {}) {
    const { branchId, startDate, endDate } = query;

    const filter = { isDeleted: false };

    if (branchId) filter.branchId = branchId;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const entries = await Daybook.find(filter);

    let totalIncome = 0;
    let totalExpense = 0;

    entries.forEach((entry) => {
      const type =
        entry.transactionType ||
        DAYBOOK_CATEGORIES_CONFIG[entry.category]?.type ||
        "expense";

      if (type === "income") {
        totalIncome += entry.amount;
      } else if (type === "expense") {
        totalExpense += entry.amount;
      }
      // transfer and asset types are excluded from income/expense totals
    });

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
    };
  }

  async getCategoryBreakdown(query = {}) {
    const { branchId, startDate, endDate } = query;

    const matchFilter = { isDeleted: false };

    if (branchId) {
      matchFilter.branchId =
        require("mongoose").Types.ObjectId.createFromHexString(branchId);
    }

    if (startDate || endDate) {
      matchFilter.date = {};
      if (startDate) matchFilter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.date.$lte = end;
      }
    }

    return Daybook.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  async getPettyCashData(query = {}, branchFilter = {}) {
    const { branchId, limit = 500 } = query;
    const base = { ...branchFilter, account: 'Petty Cash' };
    if (branchId) base.branchId = branchId;

    const [received, expenses] = await Promise.all([
      // Match both 'transfer' (new) and 'income' (legacy) for backward compatibility
      Daybook.find({ ...base, transactionType: { $in: ['transfer', 'income'] } })
        .populate('branchId', 'name code')
        .sort({ date: -1, createdAt: -1 })
        .limit(parseInt(limit)),
      Daybook.find({ ...base, transactionType: 'expense' })
        .populate('branchId', 'name code')
        .sort({ date: -1, createdAt: -1 })
        .limit(parseInt(limit)),
    ]);

    return { received, expenses };
  }

  async clearAll(branchId, deletedBy) {
    const filter = { isDeleted: false };
    if (branchId) filter.branchId = branchId;

    const result = await Daybook.updateMany(filter, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
    });

    return {
      deletedCount: result.modifiedCount,
      message: `${result.modifiedCount} daybook entries cleared successfully`,
    };
  }

  async hardClearAll(branchId) {
    const filter = {};
    if (branchId) filter.branchId = branchId;

    const result = await Daybook.deleteMany(filter);

    return {
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} daybook entries permanently deleted`,
    };
  }

  async addAttachment(id, attachment, userId) {
    const entry = await Daybook.findByIdAndUpdate(
      id,
      {
        $push: { attachments: attachment },
        updatedBy: userId,
      },
      { new: true }
    );

    if (!entry) {
      throw new Error("Entry not found");
    }

    return entry;
  }

  async removeAttachment(id, attachmentId, userId) {
    const entry = await Daybook.findByIdAndUpdate(
      id,
      {
        $pull: { attachments: { _id: attachmentId } },
        updatedBy: userId,
      },
      { new: true }
    );

    if (!entry) {
      throw new Error("Entry not found");
    }

    return entry;
  }

  async export(query = {}) {
    const { branchId, category, startDate, endDate } = query;

    const filter = { isDeleted: false };

    if (branchId) filter.branchId = branchId;
    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const entries = await Daybook.find(filter)
      .populate("branchId", "name code")
      .populate("voucherId", "voucherNo")
      .sort({ date: -1 });

    return entries.map((entry) => {
      const categoryConfig = DAYBOOK_CATEGORIES_CONFIG[entry.category];
      const type = categoryConfig?.type || "expense";

      return {
        Date: entry.date.toISOString().split("T")[0],
        Branch: entry.branchId?.name || "",
        Category: entry.category,
        Type: type,
        Description: entry.description || "",
        "Paid To": entry.paidTo || "",
        "Transaction Ref": entry.transactionRef || "",
        Amount: entry.amount,
        Voucher: entry.voucherId?.voucherNo || "",
        Remarks: entry.remarks || "",
        PaymentMonth: entry.paymentMonth,
      };
    });
  }
}

module.exports = new DaybookService();
