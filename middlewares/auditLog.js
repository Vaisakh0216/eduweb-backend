const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Create audit log entry
 */
const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  branchId,
  changes,
  ipAddress,
  userAgent,
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      branchId,
      changes,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};

/**
 * Audit middleware - logs after response
 */
const auditMiddleware = (entityType, action) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && data.success) {
        const entityId = data.data?._id || req.params.id;
        const branchId = data.data?.branchId || req.body?.branchId;

        createAuditLog({
          userId: req.user?._id,
          action,
          entityType,
          entityId,
          branchId,
          changes: {
            before: req.originalData,
            after: data.data,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  createAuditLog,
  auditMiddleware,
};
