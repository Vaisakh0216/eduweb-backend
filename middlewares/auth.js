const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

/**
 * Authenticate user via JWT
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    // Check if user still exists
    const user = await User.findById(decoded.userId)
      .populate('branches', 'name code isActive');

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact administrator.', 401));
    }

    // Grant access
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

/**
 * Restrict access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

/**
 * Check if user has access to branch
 */
const checkBranchAccess = (branchIdField = 'branchId') => {
  return (req, res, next) => {
    // Super admin has access to all branches
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const branchId = req.body[branchIdField] || req.params[branchIdField] || req.query[branchIdField];

    if (!branchId) {
      return next();
    }

    const userBranchIds = req.user.branches.map((b) => b._id.toString());

    if (!userBranchIds.includes(branchId.toString())) {
      return next(
        new AppError('You do not have access to this branch', 403)
      );
    }

    next();
  };
};

/**
 * Filter query by user's branches
 */
const filterByBranch = (req, res, next) => {
  // Super admin sees all
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  // Other users only see their branches
  const userBranchIds = req.user.branches.map((b) => b._id);
  req.branchFilter = { branchId: { $in: userBranchIds } };

  next();
};

/**
 * Restrict staff from accessing service charge fields
 */
const hideServiceChargeForStaff = (req, res, next) => {
  if (req.user.role === ROLES.STAFF) {
    req.hideServiceCharge = true;
  }
  next();
};

/**
 * Prevent staff from deleting payments
 */
const preventStaffPaymentDelete = (req, res, next) => {
  if (req.user.role === ROLES.STAFF) {
    return next(
      new AppError('Staff members cannot delete payments', 403)
    );
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  checkBranchAccess,
  filterByBranch,
  hideServiceChargeForStaff,
  preventStaffPaymentDelete,
};
