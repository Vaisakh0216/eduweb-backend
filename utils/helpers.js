const { PAGINATION } = require('./constants');
const Counter = require('../models/Counter');

/**
 * Generate pagination options
 */
const getPaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Format pagination response
 */
const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Generate voucher number atomically.
 * Always syncs the counter to the current max existing voucher first
 * (using $max, which is idempotent and safe under concurrency), then
 * atomically increments so every caller gets a unique sequence number.
 */
const generateVoucherNumber = async (branchCode) => {
  const year = new Date().getFullYear();
  const counterId = `voucher_${branchCode}_${year}`;
  const prefix = `${branchCode}-${year}`;

  // Read the highest existing voucher sequence for this prefix.
  // Must include deleted vouchers — they still occupy slots in the unique index.
  const Voucher = require('../models/Voucher');
  const lastVoucher = await Voucher.findOne({
    voucherNo: new RegExp(`^${prefix}`),
  }).setOptions({ includeDeleted: true }).sort({ voucherNo: -1 });

  const maxExistingSeq = lastVoucher
    ? parseInt(lastVoucher.voucherNo.split('-').pop(), 10)
    : 0;

  // Bump the counter up to maxExistingSeq if it's lagging (handles stale counters)
  // $max is idempotent — safe for concurrent calls
  await Counter.findOneAndUpdate(
    { _id: counterId },
    { $max: { seq: maxExistingSeq } },
    { upsert: true }
  );

  // Atomically get the next unique sequence number
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true }
  );

  return `${prefix}-${String(counter.seq).padStart(6, '0')}`;
};

/**
 * Build date range filter
 */
const buildDateRangeFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) {
      filter[field].$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
  return filter;
};

/**
 * Build search filter
 */
const buildSearchFilter = (searchTerm, fields) => {
  if (!searchTerm || !fields.length) return {};
  
  const searchRegex = new RegExp(searchTerm, 'i');
  return {
    $or: fields.map(field => ({ [field]: searchRegex })),
  };
};

/**
 * Clean object - remove undefined/null values
 */
const cleanObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

module.exports = {
  getPaginationOptions,
  formatPaginationResponse,
  generateVoucherNumber,
  buildDateRangeFilter,
  buildSearchFilter,
  cleanObject,
};
