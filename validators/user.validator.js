const { z } = require('zod');
const { ROLES } = require('../utils/constants');

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
  role: z.enum(Object.values(ROLES)),
  branches: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  role: z.enum(Object.values(ROLES)).optional(),
  branches: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
