const { z } = require('zod');
const { PAYER_TYPES, RECEIVER_TYPES, PAYMENT_MODES } = require('../utils/constants');

const createPaymentSchema = z.object({
  admissionId: z.string().min(1, 'Admission is required'),
  branchId: z.string().min(1, 'Branch is required'),
  payerType: z.enum(Object.values(PAYER_TYPES)),
  receiverType: z.enum(Object.values(RECEIVER_TYPES)),
  paymentDate: z.string().or(z.date()).optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMode: z.enum(PAYMENT_MODES),
  transactionRef: z.string().optional().nullable(),
  notes: z.string().optional(),
  isServiceChargePayment: z.boolean().optional().default(false),
  // Service charge deduction fields
  deductServiceCharge: z.boolean().optional().default(false),
  serviceChargeDeducted: z.number().min(0).optional().default(0),
  // Agent collection flow fields
  isAgentCollection: z.boolean().optional().default(false),
  collectingAgentId: z.string().optional().nullable(),
  agentFeeDeducted: z.number().min(0).optional().default(0),
  amountTransferredToConsultancy: z.number().min(0).optional().default(0),
  deductAgentFee: z.boolean().optional().default(false),
  // Agent fee payment fields
  isAgentFeePayment: z.boolean().optional().default(false),
  agentIdForFeePayment: z.string().optional().nullable(),
});

const updatePaymentSchema = z.object({
  payerType: z.enum(Object.values(PAYER_TYPES)).optional(),
  receiverType: z.enum(Object.values(RECEIVER_TYPES)).optional(),
  paymentDate: z.string().or(z.date()).optional(),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  paymentMode: z.enum(PAYMENT_MODES).optional(),
  transactionRef: z.string().optional().nullable(),
  notes: z.string().optional(),
  isServiceChargePayment: z.boolean().optional(),
  deductServiceCharge: z.boolean().optional(),
  serviceChargeDeducted: z.number().min(0).optional(),
  isAgentCollection: z.boolean().optional(),
  collectingAgentId: z.string().optional().nullable(),
  agentFeeDeducted: z.number().min(0).optional(),
  amountTransferredToConsultancy: z.number().min(0).optional(),
  isAgentFeePayment: z.boolean().optional(),
  agentIdForFeePayment: z.string().optional().nullable(),
});

module.exports = {
  createPaymentSchema,
  updatePaymentSchema,
};
