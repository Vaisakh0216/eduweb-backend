const agentPaymentService = require('../services/agentPayment.service');

const create = async (req, res, next) => {
  try {
    const payment = await agentPaymentService.create(req.validatedBody, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Agent payment recorded successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const result = await agentPaymentService.findAll(req.query, req.branchFilter || {});

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
    const payment = await agentPaymentService.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const payment = await agentPaymentService.update(
      req.params.id,
      req.validatedBody,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Agent payment updated successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await agentPaymentService.delete(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Agent payment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
};
