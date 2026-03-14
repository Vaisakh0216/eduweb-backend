const path = require('path');
const fs = require('fs');
const admissionService = require('../services/admission.service');
const Admission = require('../models/Admission');

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

const addDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    admission.documents.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      label: req.body.label || req.file.originalname,
      uploadedBy: req.user._id,
    });

    await admission.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: admission.documents,
    });
  } catch (error) {
    next(error);
  }
};

const removeDocument = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    const doc = admission.documents.id(req.params.documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete physical file
    if (doc.path && fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }

    admission.documents.pull(req.params.documentId);
    await admission.save();

    res.status(200).json({
      success: true,
      message: 'Document removed successfully',
      data: admission.documents,
    });
  } catch (error) {
    next(error);
  }
};

const getDocument = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    const doc = admission.documents.id(req.params.documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!fs.existsSync(doc.path)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    fs.createReadStream(doc.path).pipe(res);
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
  addDocument,
  removeDocument,
  getDocument,
};
