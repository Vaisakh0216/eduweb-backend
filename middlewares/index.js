const errorHandler = require('./errorHandler');
const auth = require('./auth');
const validate = require('./validate');
const auditLog = require('./auditLog');

module.exports = {
  errorHandler,
  ...auth,
  ...validate,
  ...auditLog,
};
