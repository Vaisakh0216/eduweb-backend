const cashbookService = require('../services/cashbook.service');

const create = async (req, res, next) => {
  try {
    const entry = await cashbookService.create(req.validatedBody, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Cashbook entry created successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const result = await cashbookService.findAll(req.query, req.branchFilter || {});

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getBalance = async (req, res, next) => {
  try {
    const balance = await cashbookService.getBalance(req.params.branchId);

    res.status(200).json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await cashbookService.getSummary(req.query, req.branchFilter || {});

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const entry = await cashbookService.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const entry = await cashbookService.update(
      req.params.id,
      req.validatedBody,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Cashbook entry updated successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await cashbookService.delete(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Cashbook entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const clearAll = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || req.body.branchId;
    const result = await cashbookService.clearAll(branchId, req.user._id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const hardClearAll = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || req.body.branchId;
    const result = await cashbookService.hardClearAll(branchId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  findAll,
  getBalance,
  getSummary,
  findById,
  update,
  remove,
  clearAll,
  hardClearAll,
};
