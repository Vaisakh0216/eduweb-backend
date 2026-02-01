const { z } = require('zod');

const addressSchema = z.object({
  addressLine: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional().default('India'),
});

const createBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100),
  code: z
    .string()
    .min(2, 'Branch code must be at least 2 characters')
    .max(5, 'Branch code must be at most 5 characters')
    .toUpperCase(),
  address: addressSchema.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  managerId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const updateBranchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(2).max(5).toUpperCase().optional(),
  address: addressSchema.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  managerId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

module.exports = {
  createBranchSchema,
  updateBranchSchema,
};
