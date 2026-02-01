const { z } = require('zod');
const {
  ADMISSION_STATUS,
  REFERRAL_SOURCES,
  GENDERS,
  RELIGIONS,
  QUALIFICATIONS,
  AGENT_TYPES,
} = require('../utils/constants');

// Helper to transform empty string to undefined
const emptyToUndefined = (val) => (val === '' ? undefined : val);

const studentAddressSchema = z.object({
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  addressLine: z.string().optional(),
}).optional();

const studentSchema = z.object({
  firstName: z.string().optional().default(''),
  lastName: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).transform(emptyToUndefined),
  phone: z.string().optional().default(''),
  dob: z.string().optional().nullable().transform(emptyToUndefined),
  gender: z.preprocess(emptyToUndefined, z.enum(GENDERS).optional()),
  religion: z.preprocess(emptyToUndefined, z.enum(RELIGIONS).optional()),
  highestQualification: z.preprocess(emptyToUndefined, z.enum(QUALIFICATIONS).optional()),
  address: studentAddressSchema,
  parentsPhone: z.string().optional(),
}).optional();

// Individual agent schema for multiple agents
const singleAgentSchema = z.object({
  agentType: z.preprocess(emptyToUndefined, z.enum(Object.values(AGENT_TYPES)).optional()),
  agentId: z.string().optional().nullable().transform(emptyToUndefined),
  agentFee: z.number().min(0).optional().default(0),
}).optional();

// Multiple agents schema
const agentsSchema = z.object({
  mainAgent: z.object({
    agentId: z.string().optional().nullable().transform(emptyToUndefined),
    agentFee: z.number().min(0).optional().default(0),
  }).optional(),
  collegeAgent: z.object({
    agentId: z.string().optional().nullable().transform(emptyToUndefined),
    agentFee: z.number().min(0).optional().default(0),
  }).optional(),
  subAgent: z.object({
    agentId: z.string().optional().nullable().transform(emptyToUndefined),
    agentFee: z.number().min(0).optional().default(0),
  }).optional(),
}).optional();

// Legacy single agent schema for backward compatibility
const agentSchema = z.object({
  agentType: z.preprocess(emptyToUndefined, z.enum(Object.values(AGENT_TYPES)).optional()),
  agentId: z.string().optional().nullable().transform(emptyToUndefined),
  agentFee: z.number().min(0).optional().default(0),
}).optional();

const feesSchema = z.object({
  offeredFee: z.number().min(0).optional().default(0),
  admissionFee: z.number().min(0).optional().default(0),
  tuitionFeeYear1: z.number().min(0).optional().default(0),
  tuitionFeeYear2: z.number().min(0).optional().default(0),
  tuitionFeeYear3: z.number().min(0).optional().default(0),
  tuitionFeeYear4: z.number().min(0).optional().default(0),
  hostelIncluded: z.boolean().optional().default(false),
  hostelFeeYear1: z.number().min(0).optional().default(0),
  hostelFeeYear2: z.number().min(0).optional().default(0),
  hostelFeeYear3: z.number().min(0).optional().default(0),
  hostelFeeYear4: z.number().min(0).optional().default(0),
}).optional();

const serviceChargeSchema = z.object({
  agreed: z.number().min(0).optional().default(0),
  received: z.number().min(0).optional().default(0),
}).optional();

const createAdmissionSchema = z.object({
  admissionDate: z.string().or(z.date()).optional(),
  branchId: z.string().min(1, 'Branch is required'),
  academicYear: z.string().optional().default(''),
  admissionStatus: z.preprocess(emptyToUndefined, z.enum(Object.values(ADMISSION_STATUS)).optional().default('Pending')),
  referralSource: z.preprocess(emptyToUndefined, z.enum(REFERRAL_SOURCES).optional()),
  student: studentSchema,
  collegeId: z.string().optional().nullable().transform(emptyToUndefined),
  courseId: z.string().optional().nullable().transform(emptyToUndefined),
  agent: agentSchema,
  agents: agentsSchema,
  fees: feesSchema,
  serviceCharge: serviceChargeSchema,
  notes: z.string().optional(),
});

const updateAdmissionSchema = z.object({
  admissionDate: z.string().or(z.date()).optional(),
  branchId: z.string().optional(),
  academicYear: z.string().optional(),
  admissionStatus: z.preprocess(emptyToUndefined, z.enum(Object.values(ADMISSION_STATUS)).optional()),
  referralSource: z.preprocess(emptyToUndefined, z.enum(REFERRAL_SOURCES).optional()),
  student: studentSchema,
  collegeId: z.string().optional().nullable().transform(emptyToUndefined),
  courseId: z.string().optional().nullable().transform(emptyToUndefined),
  agent: agentSchema,
  agents: agentsSchema,
  fees: feesSchema,
  serviceCharge: serviceChargeSchema,
  notes: z.string().optional(),
});

module.exports = {
  createAdmissionSchema,
  updateAdmissionSchema,
};
