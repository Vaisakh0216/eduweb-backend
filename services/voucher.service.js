const Voucher = require('../models/Voucher');
const AppError = require('../utils/AppError');
const {
  getPaginationOptions,
  formatPaginationResponse,
  buildDateRangeFilter,
} = require('../utils/helpers');

class VoucherService {
  async findAll(query, branchFilter) {
    const { page, limit, skip } = getPaginationOptions(query);
    let filter = { ...branchFilter };

    // Search by voucher number
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { voucherNo: searchRegex },
        { partyName: searchRegex },
        { description: searchRegex },
      ];
    }

    // Filter by branch
    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    // Filter by type
    if (query.voucherType) {
      filter.voucherType = query.voucherType;
    }

    // Filter by admission
    if (query.admissionId) {
      filter.admissionId = query.admissionId;
    }

    // Date range filter
    const dateFilter = buildDateRangeFilter(
      query.startDate,
      query.endDate,
      'voucherDate'
    );
    filter = { ...filter, ...dateFilter };

    const [vouchers, total] = await Promise.all([
      Voucher.find(filter)
        .populate('branchId', 'name code')
        .populate('admissionId', 'admissionNo student.firstName student.lastName')
        .populate('createdBy', 'firstName lastName')
        .sort({ voucherDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Voucher.countDocuments(filter),
    ]);

    return formatPaginationResponse(vouchers, total, page, limit);
  }

  async findById(id) {
    const voucher = await Voucher.findById(id)
      .populate('branchId', 'name code address phone email')
      .populate('admissionId', 'admissionNo student collegeId courseId')
      .populate({
        path: 'admissionId',
        populate: [
          { path: 'collegeId', select: 'name' },
          { path: 'courseId', select: 'name' },
        ],
      })
      .populate('createdBy', 'firstName lastName');

    if (!voucher) {
      throw new AppError('Voucher not found', 404);
    }

    return voucher;
  }

  async findByVoucherNo(voucherNo) {
    const voucher = await Voucher.findOne({ voucherNo })
      .populate('branchId', 'name code address phone email')
      .populate('admissionId', 'admissionNo student collegeId courseId')
      .populate({
        path: 'admissionId',
        populate: [
          { path: 'collegeId', select: 'name' },
          { path: 'courseId', select: 'name' },
        ],
      })
      .populate('createdBy', 'firstName lastName');

    if (!voucher) {
      throw new AppError('Voucher not found', 404);
    }

    return voucher;
  }

  async recordPrint(id, userId) {
    const voucher = await Voucher.findById(id);

    if (!voucher) {
      throw new AppError('Voucher not found', 404);
    }

    voucher.printCount += 1;
    voucher.lastPrintedAt = new Date();
    voucher.lastPrintedBy = userId;
    await voucher.save();

    return voucher;
  }
}

module.exports = new VoucherService();
