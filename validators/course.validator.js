const { z } = require('zod');

const durationSchema = z.object({
  years: z.number().min(1).max(10).optional().default(4),
  description: z.string().optional(),
});

const feesSchema = z.object({
  year1: z.number().min(0).optional().default(0),
  year2: z.number().min(0).optional().default(0),
  year3: z.number().min(0).optional().default(0),
  year4: z.number().min(0).optional().default(0),
});

const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(200),
  code: z.string().max(20).optional(),
  collegeId: z.string().min(1, 'College is required'),
  duration: durationSchema.optional(),
  degree: z.string().optional(),
  specialization: z.string().optional(),
  fees: feesSchema.optional(),
  hostelFees: feesSchema.optional(),
  description: z.string().optional(),
  eligibility: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const updateCourseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().max(20).optional(),
  collegeId: z.string().optional(),
  duration: durationSchema.optional(),
  degree: z.string().optional(),
  specialization: z.string().optional(),
  fees: feesSchema.optional(),
  hostelFees: feesSchema.optional(),
  description: z.string().optional(),
  eligibility: z.string().optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
};
