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

  DAYBOOK_ACCOUNTS: ['Cash', 'Bank', 'Petty Cash'],

  DAYBOOK_TYPES: {
    INCOME: 'income',
    EXPENSE: 'expense',
    TRANSFER: 'transfer',
    ASSET: 'asset',
  },

  DAYBOOK_CATEGORIES: [
    'opening_balance',
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
    'wifi_phone_bill',
    'recharge',
    'food_refreshment',
    'stationery',
    'printing',
    'maintenance',
    'advertisement_marketing',
    'college_visit',
    'field_work',
    'data_collection',
    'agent_commission',
    'sub_agent_commission',
    'donation',
    'investment',
  ],

  DAYBOOK_CATEGORIES_CONFIG: {
    opening_balance: { type: 'asset' },
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
    wifi_phone_bill: { type: 'expense' },
    recharge: { type: 'expense' },
    food_refreshment: { type: 'expense' },
    stationery: { type: 'expense' },
    printing: { type: 'expense' },
    maintenance: { type: 'expense' },
    advertisement_marketing: { type: 'expense' },
    college_visit: { type: 'expense' },
    field_work: { type: 'expense' },
    data_collection: { type: 'expense' },
    agent_commission: { type: 'expense' },
    sub_agent_commission: { type: 'expense' },
    donation: { type: 'expense' },
    investment: { type: 'asset' },
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
};
