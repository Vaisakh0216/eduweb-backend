const { z } = require('zod');
const { PAYMENT_MODES } = require('../utils/constants');

const createAgentPaymentSchema = z.object({
  admissionId: z.string().min(1, 'Admission is required'),
  agentId: z.string().min(1, 'Agent is required'),
  branchId: z.string().min(1, 'Branch is required'),
  paymentDate: z.string().or(z.date()).optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMode: z.enum(PAYMENT_MODES),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

const updateAgentPaymentSchema = z.object({
  paymentDate: z.string().or(z.date()).optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  paymentMode: z.enum(PAYMENT_MODES).optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

module.exports = {
  createAgentPaymentSchema,
  updateAgentPaymentSchema,
};
