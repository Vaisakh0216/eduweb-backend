const collegeService = require('../services/college.service');

const create = async (req, res, next) => {
  try {
    const college = await collegeService.create(req.validatedBody, req.user._id);

    res.status(201).json({
      success: true,
      message: 'College created successfully',
      data: college,
    });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const result = await collegeService.findAll(req.query);

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
    const colleges = await collegeService.findAllActive();

    res.status(200).json({
      success: true,
      data: colleges,
    });
  } catch (error) {
    next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const college = await collegeService.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: college,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const college = await collegeService.update(
      req.params.id,
      req.validatedBody,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'College updated successfully',
      data: college,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await collegeService.delete(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'College deleted successfully',
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
  update,
  remove,
};
