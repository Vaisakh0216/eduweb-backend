const voucherService = require('../services/voucher.service');

const findAll = async (req, res, next) => {
  try {
    const result = await voucherService.findAll(req.query, req.branchFilter || {});

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
    const voucher = await voucherService.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

const findByVoucherNo = async (req, res, next) => {
  try {
    const voucher = await voucherService.findByVoucherNo(req.params.voucherNo);

    res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

const recordPrint = async (req, res, next) => {
  try {
    const voucher = await voucherService.recordPrint(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Print recorded',
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findAll,
  findById,
  findByVoucherNo,
  recordPrint,
};
