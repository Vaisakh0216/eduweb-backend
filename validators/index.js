module.exports = {
  auth: require('./auth.validator'),
  user: require('./user.validator'),
  branch: require('./branch.validator'),
  college: require('./college.validator'),
  course: require('./course.validator'),
  agent: require('./agent.validator'),
  admission: require('./admission.validator'),
  payment: require('./payment.validator'),
  agentPayment: require('./agentPayment.validator'),
  daybook: require('./daybook.validator'),
  cashbook: require('./cashbook.validator'),
};
