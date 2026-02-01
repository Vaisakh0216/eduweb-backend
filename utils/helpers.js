const { PAGINATION } = require('./constants');

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
 * Generate voucher number
 */
const generateVoucherNumber = async (branchCode, VoucherModel) => {
  const year = new Date().getFullYear();
  const prefix = `${branchCode}-${year}`;
  
  const lastVoucher = await VoucherModel.findOne({
    voucherNo: new RegExp(`^${prefix}`),
  }).sort({ voucherNo: -1 });
  
  let sequence = 1;
  if (lastVoucher) {
    const lastSeq = parseInt(lastVoucher.voucherNo.split('-').pop());
    sequence = lastSeq + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(6, '0')}`;
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
