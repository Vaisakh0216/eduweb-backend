const admissionService = require('../services/admission.service');

const create = async (req, res, next) => {
  try {
    const admission = await admissionService.create(req.validatedBody, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Admission created successfully',
      data: admission,
    });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const result = await admissionService.findAll(
      req.query,
      req.branchFilter || {},
      req.hideServiceCharge
    );

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
    const admission = await admissionService.findById(
      req.params.id,
      req.hideServiceCharge
    );

    res.status(200).json({
      success: true,
      data: admission,
    });
  } catch (error) {
    next(error);
  }
};

const getAdmissionDetails = async (req, res, next) => {
  try {
    const details = await admissionService.getAdmissionDetails(
      req.params.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const admission = await admissionService.update(
      req.params.id,
      req.validatedBody,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Admission updated successfully',
      data: admission,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await admissionService.delete(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Admission deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Recalculate payment summary for an admission
const recalculateSummary = async (req, res, next) => {
  try {
    await admissionService.updatePaymentSummary(req.params.id, {});
    const admission = await admissionService.findById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Payment summary recalculated successfully',
      data: admission,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  findAll,
  findById,
  getAdmissionDetails,
  update,
  remove,
  recalculateSummary,
};
