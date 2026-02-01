const { z } = require('zod');
const { AGENT_TYPES } = require('../utils/constants');

const addressSchema = z.object({
  addressLine: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

const bankDetailsSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolderName: z.string().optional(),
  upiId: z.string().optional(),
});

const createAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100),
  agentType: z.enum(Object.values(AGENT_TYPES)),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: addressSchema.optional(),
  bankDetails: bankDetailsSchema.optional(),
  commissionRate: z.number().min(0).max(100).optional().default(0),
  parentAgentId: z.string().optional().nullable(),
  linkedColleges: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  agentType: z.enum(Object.values(AGENT_TYPES)).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: addressSchema.optional(),
  bankDetails: bankDetailsSchema.optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  parentAgentId: z.string().optional().nullable(),
  linkedColleges: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  createAgentSchema,
  updateAgentSchema,
};
