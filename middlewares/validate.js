const AppError = require('../utils/AppError');

/**
 * Validate request body against Zod schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Validation failed', 400, errors));
      }

      req.validatedBody = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Query validation failed', 400, errors));
      }

      req.validatedQuery = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate params
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Params validation failed', 400, errors));
      }

      req.validatedParams = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
};
