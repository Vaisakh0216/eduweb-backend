const journalService = require('../services/journal.service');

const create = async (req, res, next) => {
  try {
    const journal = await journalService.create(req.body, req.user._id);
    res.status(201).json({ success: true, message: 'Journal entry created', data: journal });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const branchFilter = req.branchFilter || {};
    const result = await journalService.findAll(req.query, branchFilter);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const findByAdmission = async (req, res, next) => {
  try {
    const journals = await journalService.findByAdmission(req.params.admissionId);
    res.status(200).json({ success: true, data: journals });
  } catch (error) {
    next(error);
  }
};

const settle = async (req, res, next) => {
  try {
    const journal = await journalService.settle(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: 'Journal entry settled', data: journal });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await journalService.delete(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: 'Journal entry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, findAll, findByAdmission, settle, remove };
