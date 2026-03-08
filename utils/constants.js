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

  DAYBOOK_CATEGORIES_CONFIG: {
    electricity_bill: { type: 'expense' },
    water_bill: { type: 'expense' },
    office_rent: { type: 'expense' },
    salary: { type: 'expense' },
    paid_to_college: { type: 'expense' },
    paid_to_agent: { type: 'expense' },
    received_from_student: { type: 'income' },
    received_from_college_service_charge: { type: 'income' },
    service_charge_income: { type: 'income' },
    misc: { type: 'expense' },
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
};
