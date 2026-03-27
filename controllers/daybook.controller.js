const fs = require('fs');
const daybookService = require('../services/daybook.service');
const { getSignedFileUrl } = require('../utils/s3');

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
    const result = await daybookService.getAll(req.query, req.branchFilter || {});

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
    const breakdown = await daybookService.getCategoryBreakdown(req.query);

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
    const entry = await daybookService.getById(req.params.id);

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

const getPettyCashData = async (req, res, next) => {
  try {
    const result = await daybookService.getPettyCashData(req.query, req.branchFilter || {});

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const clearAll = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || req.body.branchId;
    const result = await daybookService.clearAll(branchId, req.user._id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    next(error);
  }
};

const hardClearAll = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || req.body.branchId;
    const result = await daybookService.hardClearAll(branchId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    next(error);
  }
};

const exportCSV = async (req, res, next) => {
  try {
    const data = await daybookService.export(req.query);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const addAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const attachment = {
      filename: req.file.key,           // S3 key (used for signed URLs / deletion)
      originalName: req.file.originalname,
      path: req.file.location,          // S3 URL
      mimeType: req.file.mimetype || req.file.contentType,
      size: req.file.size,
    };

    const entry = await daybookService.addAttachment(req.params.id, attachment, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const removeAttachment = async (req, res, next) => {
  try {
    const entry = await daybookService.removeAttachment(
      req.params.id,
      req.params.attachmentId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Attachment removed successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const getAttachment = async (req, res, next) => {
  try {
    const entry = await daybookService.getById(req.params.id);
    const attachment = entry.attachments.find(
      (a) => a._id.toString() === req.params.attachmentId
    );

    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // S3 file — generate signed URL and redirect
    if (attachment.path && attachment.path.startsWith('http')) {
      const signedUrl = await getSignedFileUrl(attachment.filename);
      return res.redirect(signedUrl);
    }

    // Legacy local file
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    fs.createReadStream(attachment.path).pipe(res);
  } catch (error) {
    next(error);
  }
};

const setOpeningBalance = async (req, res, next) => {
  try {
    const entry = await daybookService.setOpeningBalance(req.body, req.user._id);
    res.status(200).json({ success: true, message: 'Opening balance set successfully', data: entry });
  } catch (error) {
    next(error);
  }
};

const getOpeningBalance = async (req, res, next) => {
  try {
    const entry = await daybookService.getOpeningBalance(req.params.branchId);
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  findAll,
  setOpeningBalance,
  getOpeningBalance,
  getSummary,
  getCategoryBreakdown,
  getPettyCashData,
  findById,
  update,
  remove,
  clearAll,
  hardClearAll,
  exportCSV,
  addAttachment,
  removeAttachment,
  getAttachment,
};
