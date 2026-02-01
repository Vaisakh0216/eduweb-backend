const path = require('path');
const fs = require('fs');
const paymentService = require('../services/payment.service');
const Payment = require('../models/Payment');

const create = async (req, res, next) => {
  try {
    // Parse JSON body if sent as multipart
    let paymentData = req.body;
    if (typeof req.body.data === 'string') {
      paymentData = JSON.parse(req.body.data);
    }

    // Handle file upload
    if (req.file) {
      paymentData.attachment = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    }

    const payment = await paymentService.create(paymentData, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const findAll = async (req, res, next) => {
  try {
    const result = await paymentService.findAll(req.query, req.branchFilter || {});

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
    const payment = await paymentService.findById(req.params.id);

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
    let paymentData = req.body;
    if (typeof req.body.data === 'string') {
      paymentData = JSON.parse(req.body.data);
    }

    // Handle file upload
    if (req.file) {
      paymentData.attachment = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    }

    const payment = await paymentService.update(
      req.params.id,
      paymentData,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await paymentService.delete(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const checkTransactionRef = async (req, res, next) => {
  try {
    const result = await paymentService.checkTransactionRef(req.query.transactionRef);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAttachment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment || !payment.attachment || !payment.attachment.path) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    const filePath = payment.attachment.path;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server',
      });
    }

    res.setHeader('Content-Type', payment.attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${payment.attachment.originalName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
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
  checkTransactionRef,
  getAttachment,
};
