const agentService = require('../services/agent.service');

const create = async (req, res, next) => {
  try {
    const agent = await agentService.create(req.validatedBody, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const result = await agentService.findAll(req.query);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const findAllActive = async (req, res, next) => {
  try {
    const agents = await agentService.findAllActive(req.query.agentType);

    res.status(200).json({
      success: true,
      data: agents,
    });
  } catch (error) {
    next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const agent = await agentService.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};

const getAgentDetails = async (req, res, next) => {
  try {
    const details = await agentService.getAgentDetails(req.params.id);

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
    const agent = await agentService.update(
      req.params.id,
      req.validatedBody,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await agentService.delete(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  findAll,
  findAllActive,
  findById,
  getAgentDetails,
  update,
  remove,
};
