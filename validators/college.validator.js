const { z } = require('zod');

const addressSchema = z.object({
  addressLine: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional().default('India'),
});

const contactPersonSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  designation: z.string().optional(),
});

const bankDetailsSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolderName: z.string().optional(),
});

const createCollegeSchema = z.object({
  name: z.string().min(1, 'College name is required').max(200),
  code: z.string().max(20).optional(),
  address: addressSchema.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  contactPerson: contactPersonSchema.optional(),
  bankDetails: bankDetailsSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

const updateCollegeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().max(20).optional(),
  address: addressSchema.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  contactPerson: contactPersonSchema.optional(),
  bankDetails: bankDetailsSchema.optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  createCollegeSchema,
  updateCollegeSchema,
};
