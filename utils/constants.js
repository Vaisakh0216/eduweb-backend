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
    'Telecaller',
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

  JOURNAL_TYPES: {
    SC_COLLECTED_BY_AGENT: 'sc_collected_by_agent', // Student paid SC directly to agent
    SC_ADJUSTMENT: 'sc_adjustment',                  // Manual service charge correction
    FEE_ADJUSTMENT: 'fee_adjustment',                // Fee discount / correction
    AGENT_BALANCE_ADJUSTMENT: 'agent_balance_adjustment', // Agent balance correction
    GENERAL: 'general',                              // Any other manual adjustment
  },

  JOURNAL_TYPE_LABELS: {
    sc_collected_by_agent: 'SC Collected by Agent',
    sc_adjustment: 'Service Charge Adjustment',
    fee_adjustment: 'Fee Adjustment',
    agent_balance_adjustment: 'Agent Balance Adjustment',
    general: 'General Adjustment',
  },

  JOURNAL_STATUSES: {
    PENDING: 'pending',      // For sc_collected_by_agent: agent holds SC, not yet remitted
    SETTLED: 'settled',      // For sc_collected_by_agent: agent remitted SC to consultancy
    COMPLETED: 'completed',  // For all other types
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
};
