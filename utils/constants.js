module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    STAFF: 'staff',
  },

  ADMISSION_STATUS: {
    CONFIRMED: 'Confirmed',
    PENDING: 'Pending',
    CANCELLED: 'Cancelled',
  },

  REFERRAL_SOURCES: [
    'Website',
    'Social Media',
    'Agent',
    'Walk-in',
    'Reference',
    'Advertisement',
    'Other',
  ],

  GENDERS: ['Male', 'Female', 'Other'],

  RELIGIONS: [
    'Hindu',
    'Muslim',
    'Christian',
    'Sikh',
    'Buddhist',
    'Jain',
    'Other',
  ],

  QUALIFICATIONS: [
    '10th',
    '12th',
    'Diploma',
    'Graduate',
    'Post Graduate',
    'PhD',
    'Other',
  ],

  AGENT_TYPES: {
    MAIN: 'Main',
    COLLEGE: 'College',
    SUB: 'Sub',
  },

  PAYER_TYPES: {
    STUDENT: 'Student',
    COLLEGE: 'College',
    CONSULTANCY: 'Consultancy',
    AGENT: 'Agent',
  },

  RECEIVER_TYPES: {
    CONSULTANCY: 'Consultancy',
    COLLEGE: 'College',
    AGENT: 'Agent',
  },

  PAYMENT_MODES: [
    'Cash',
    'UPI',
    'Card',
    'BankTransfer',
    'Cheque',
  ],

  DAYBOOK_TYPES: {
    INCOME: 'income',
    EXPENSE: 'expense',
  },

  DAYBOOK_CATEGORIES: [
    'electricity_bill',
    'water_bill',
    'office_rent',
    'salary',
    'paid_to_college',
    'paid_to_agent',
    'received_from_student',
    'received_from_college_service_charge',
    'service_charge_income',
    'misc',
  ],

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
};
