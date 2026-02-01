const { z } = require('zod');
const { DAYBOOK_CATEGORIES } = require('../utils/constants');

const createCashbookSchema = z.object({
  date: z.string().or(z.date()).optional(),
  branchId: z.string().min(1, 'Branch is required'),
  category: z.enum(DAYBOOK_CATEGORIES),
  description: z.string().optional(),
  credited: z.number().min(0).optional().default(0),
  debited: z.number().min(0).optional().default(0),
  remarks: z.string().optional(),
  voucherId: z.string().optional().nullable(),
  daybookId: z.string().optional().nullable(),
});

const updateCashbookSchema = z.object({
  date: z.string().or(z.date()).optional(),
  category: z.enum(DAYBOOK_CATEGORIES).optional(),
  description: z.string().optional(),
  credited: z.number().min(0).optional(),
  debited: z.number().min(0).optional(),
  remarks: z.string().optional(),
});

module.exports = {
  createCashbookSchema,
  updateCashbookSchema,
};
