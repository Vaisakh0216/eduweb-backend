const { z } = require('zod');
const { DAYBOOK_TYPES, DAYBOOK_CATEGORIES, PAYMENT_MODES } = require('../utils/constants');

const createDaybookSchema = z.object({
  date: z.string().or(z.date()).optional(),
  branchId: z.string().min(1, 'Branch is required'),
  category: z.enum(DAYBOOK_CATEGORIES),
  type: z.enum(Object.values(DAYBOOK_TYPES)),
  amount: z.number().min(0, 'Amount must be positive'),
  dueAmount: z.number().min(0).optional().default(0),
  description: z.string().optional(),
  remarks: z.string().optional(),
  admissionId: z.string().optional().nullable(),
  paymentId: z.string().optional().nullable(),
  agentPaymentId: z.string().optional().nullable(),
  paymentMode: z.enum(PAYMENT_MODES).optional().default('Cash'),
  partyName: z.string().optional(),
});

const updateDaybookSchema = z.object({
  date: z.string().or(z.date()).optional(),
  category: z.enum(DAYBOOK_CATEGORIES).optional(),
  type: z.enum(Object.values(DAYBOOK_TYPES)).optional(),
  amount: z.number().min(0).optional(),
  dueAmount: z.number().min(0).optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
  paymentMode: z.enum(PAYMENT_MODES).optional(),
  partyName: z.string().optional(),
});

module.exports = {
  createDaybookSchema,
  updateDaybookSchema,
};
