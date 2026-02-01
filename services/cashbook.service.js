const Cashbook = require("../models/Cashbook");
const AppError = require("../utils/AppError");
const {
  getPaginationOptions,
  formatPaginationResponse,
  buildDateRangeFilter,
  cleanObject,
} = require("../utils/helpers");

class CashbookService {
  async create(data, createdBy) {
    // Get last balance
    const lastEntry = await Cashbook.findOne({ branchId: data.branchId }).sort({
      date: -1,
      createdAt: -1,
    });

    const previousBalance = lastEntry?.runningBalance || 0;
    const runningBalance =
      previousBalance + (data.credited || 0) - (data.debited || 0);

    const entry = await Cashbook.create({
      ...data,
      date: data.date || new Date(),
      runningBalance,
      createdBy,
    });

    return entry.populate([{ path: "branchId", select: "name code" }]);
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

    // Date range filter
    const dateFilter = buildDateRangeFilter(
      query.startDate,
      query.endDate,
      "date"
    );
    filter = { ...filter, ...dateFilter };

    const [entries, total] = await Promise.all([
      Cashbook.find(filter)
        .populate("branchId", "name code")
        .populate("voucherId", "voucherNo")
        .populate("createdBy", "firstName lastName")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Cashbook.countDocuments(filter),
    ]);

    return formatPaginationResponse(entries, total, page, limit);
  }

  async getBalance(branchId) {
    const lastEntry = await Cashbook.findOne({
      branchId,
      isDeleted: false,
    }).sort({ date: -1, createdAt: -1 });

    return lastEntry?.runningBalance || 0;
  }

  async getBalancesByBranch(branchIds) {
    const balances = await Promise.all(
      branchIds.map(async (branchId) => {
        const balance = await this.getBalance(branchId);
        return { branchId, balance };
      })
    );

    return balances;
  }

  async getSummary(query, branchFilter) {
    let matchFilter = { isDeleted: false, ...branchFilter };

    if (query.branchId) {
      matchFilter.branchId =
        require("mongoose").Types.ObjectId.createFromHexString(query.branchId);
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

    const summary = await Cashbook.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalCredited: { $sum: "$credited" },
          totalDebited: { $sum: "$debited" },
          transactions: { $sum: 1 },
        },
      },
    ]);

    // Get current balance
    let currentBalance = 0;
    if (query.branchId) {
      currentBalance = await this.getBalance(query.branchId);
    } else {
      // All branches - calculate from totals
      // Current balance = Total Credited - Total Debited
      const totalCredited = summary[0]?.totalCredited || 0;
      const totalDebited = summary[0]?.totalDebited || 0;
      currentBalance = totalCredited - totalDebited;
    }

    return {
      totalCredited: summary[0]?.totalCredited || 0,
      totalDebited: summary[0]?.totalDebited || 0,
      transactions: summary[0]?.transactions || 0,
      currentBalance,
    };
  }

  async findById(id) {
    const entry = await Cashbook.findById(id)
      .populate("branchId", "name code")
      .populate("voucherId", "voucherNo")
      .populate("createdBy", "firstName lastName");

    if (!entry) {
      throw new AppError("Cashbook entry not found", 404);
    }

    return entry;
  }

  async update(id, data, updatedBy) {
    const entry = await Cashbook.findById(id);

    if (!entry) {
      throw new AppError("Cashbook entry not found", 404);
    }

    // Recalculate running balance if credited/debited changed
    if (data.credited !== undefined || data.debited !== undefined) {
      const previousEntry = await Cashbook.findOne({
        branchId: entry.branchId,
        date: { $lt: entry.date },
        isDeleted: false,
      }).sort({ date: -1, createdAt: -1 });

      const previousBalance = previousEntry?.runningBalance || 0;
      const credited =
        data.credited !== undefined ? data.credited : entry.credited;
      const debited = data.debited !== undefined ? data.debited : entry.debited;
      data.runningBalance = previousBalance + credited - debited;
    }

    Object.assign(entry, cleanObject(data));
    entry.updatedBy = updatedBy;
    await entry.save();

    return entry.populate([{ path: "branchId", select: "name code" }]);
  }

  async delete(id, deletedBy) {
    const entry = await Cashbook.findById(id);

    if (!entry) {
      throw new AppError("Cashbook entry not found", 404);
    }

    entry.isDeleted = true;
    entry.deletedAt = new Date();
    entry.deletedBy = deletedBy;
    await entry.save();

    return true;
  }

  async clearAll(branchId, deletedBy) {
    const filter = { isDeleted: false };

    if (branchId) {
      filter.branchId = branchId;
    }

    // Soft delete all entries
    const result = await Cashbook.updateMany(filter, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
    });

    return {
      deletedCount: result.modifiedCount,
      message: `${result.modifiedCount} cashbook entries cleared successfully`,
    };
  }

  async hardClearAll(branchId) {
    const filter = {};

    if (branchId) {
      filter.branchId = branchId;
    }

    // Permanently delete all entries
    const result = await Cashbook.deleteMany(filter);

    return {
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} cashbook entries permanently deleted`,
    };
  }
}

module.exports = new CashbookService();
