const daybookService = require('../services/daybook.service');

const create = async (req, res, next) => {
  try {
    const entry = await daybookService.create(req.validatedBody, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Daybook entry created successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const result = await daybookService.findAll(req.query, req.branchFilter || {});

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await daybookService.getSummary(req.query, req.branchFilter || {});

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await daybookService.getCategoryBreakdown(
      req.query,
      req.branchFilter || {}
    );

    res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const entry = await daybookService.findById(req.params.id);

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
    const entry = await daybookService.update(
      req.params.id,
      req.validatedBody,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Daybook entry updated successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await daybookService.delete(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Daybook entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const exportCSV = async (req, res, next) => {
  try {
    const data = await daybookService.exportToCSV(req.query, req.branchFilter || {});

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  findAll,
  getSummary,
  getCategoryBreakdown,
  findById,
  update,
  remove,
  exportCSV,
};
