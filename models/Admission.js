const mongoose = require('mongoose');
const {
  ADMISSION_STATUS,
  REFERRAL_SOURCES,
  GENDERS,
  RELIGIONS,
  QUALIFICATIONS,
  AGENT_TYPES,
} = require('../utils/constants');

const admissionSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      unique: true,
    },
    admissionDate: {
      type: Date,
      required: [true, 'Admission date is required'],
      default: Date.now,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
    },
    admissionStatus: {
      type: String,
      enum: Object.values(ADMISSION_STATUS),
      default: ADMISSION_STATUS.PENDING,
    },
    referralSource: {
      type: String,
      enum: REFERRAL_SOURCES,
    },

    // Student Details
    student: {
      firstName: {
        type: String,
        required: [true, 'Student first name is required'],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, 'Student last name is required'],
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Student phone is required'],
        trim: true,
      },
      dob: Date,
      gender: {
        type: String,
        enum: GENDERS,
      },
      religion: {
        type: String,
        enum: RELIGIONS,
      },
      highestQualification: {
        type: String,
        enum: QUALIFICATIONS,
      },
      address: {
        state: String,
        district: String,
        city: String,
        pincode: String,
        addressLine: String,
      },
      parentsPhone: String,
    },

    // Course Details
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },

    // Agent Details (Legacy - Single Agent)
    agent: {
      agentType: {
        type: String,
        enum: Object.values(AGENT_TYPES),
      },
      agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
      },
      agentFee: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Multiple Agents Support
    agents: {
      mainAgent: {
        agentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Agent',
        },
        agentFee: {
          type: Number,
          default: 0,
          min: 0,
        },
        feePaid: {
          type: Number,
          default: 0,
          min: 0,
        },
        feeDue: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      collegeAgent: {
        agentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Agent',
        },
        agentFee: {
          type: Number,
          default: 0,
          min: 0,
        },
        feePaid: {
          type: Number,
          default: 0,
          min: 0,
        },
        feeDue: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      subAgent: {
        agentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Agent',
        },
        agentFee: {
          type: Number,
          default: 0,
          min: 0,
        },
        feePaid: {
          type: Number,
          default: 0,
          min: 0,
        },
        feeDue: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      totalAgentFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalAgentFeePaid: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalAgentFeeDue: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Fees
    fees: {
      offeredFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      admissionFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      tuitionFeeYear1: {
        type: Number,
        default: 0,
        min: 0,
      },
      tuitionFeeYear2: {
        type: Number,
        default: 0,
        min: 0,
      },
      tuitionFeeYear3: {
        type: Number,
        default: 0,
        min: 0,
      },
      tuitionFeeYear4: {
        type: Number,
        default: 0,
        min: 0,
      },
      hostelIncluded: {
        type: Boolean,
        default: false,
      },
      hostelFeeYear1: {
        type: Number,
        default: 0,
        min: 0,
      },
      hostelFeeYear2: {
        type: Number,
        default: 0,
        min: 0,
      },
      hostelFeeYear3: {
        type: Number,
        default: 0,
        min: 0,
      },
      hostelFeeYear4: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalFee: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Service Charge (Hidden from Staff)
    // Service charge is the amount consultancy earns from this admission
    // It can be received from College or deducted from Student payments or deducted by Agent
    serviceCharge: {
      agreed: {
        type: Number,
        default: 0,
        min: 0,
        // Total service charge amount agreed for this admission
      },
      receivedFromCollege: {
        type: Number,
        default: 0,
        min: 0,
        // Amount received directly from college to consultancy
      },
      deductedFromStudent: {
        type: Number,
        default: 0,
        min: 0,
        // Amount deducted/kept by consultancy from student payments
      },
      deductedByAgent: {
        type: Number,
        default: 0,
        min: 0,
        // Amount deducted by agent (agent fee is part of service charge)
      },
      paidBackToCollege: {
        type: Number,
        default: 0,
        min: 0,
        // Amount paid back to college from deducted service charge
        // This reduces the effective service charge received
      },
      received: {
        type: Number,
        default: 0,
        min: 0,
        // Total received = receivedFromCollege + deductedFromStudent + deductedByAgent - paidBackToCollege
      },
      due: {
        type: Number,
        default: 0,
        min: 0,
        // Pending service charge = agreed - received
      },
    },

    // College Payment Tracking
    // When student pays consultancy, consultancy needs to pay college (minus service charge)
    collegePayment: {
      totalDueToCollege: {
        type: Number,
        default: 0,
        min: 0,
        // Total amount consultancy needs to pay to college
      },
      paidToCollege: {
        type: Number,
        default: 0,
        min: 0,
        // Amount already paid to college
      },
      balanceDueToCollege: {
        type: Number,
        default: 0,
        min: 0,
        // Pending amount to be paid to college
      },
    },

    // Computed Payment Summary
    paymentSummary: {
      studentPaid: {
        type: Number,
        default: 0,
      },
      studentDue: {
        type: Number,
        default: 0,
      },
      agentPaid: {
        type: Number,
        default: 0,
      },
      agentDue: {
        type: Number,
        default: 0,
      },
    },

    notes: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate admission number before save
admissionSchema.pre('save', async function (next) {
  if (this.isNew && !this.admissionNo) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    });
    this.admissionNo = `ADM-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Calculate total fee before save
admissionSchema.pre('save', function (next) {
  const fees = this.fees;
  fees.totalFee =
    (fees.offeredFee || 0) +
    (fees.admissionFee || 0) +
    (fees.tuitionFeeYear1 || 0) +
    (fees.tuitionFeeYear2 || 0) +
    (fees.tuitionFeeYear3 || 0) +
    (fees.tuitionFeeYear4 || 0);

  if (fees.hostelIncluded) {
    fees.totalFee +=
      (fees.hostelFeeYear1 || 0) +
      (fees.hostelFeeYear2 || 0) +
      (fees.hostelFeeYear3 || 0) +
      (fees.hostelFeeYear4 || 0);
  }

  // Calculate service charge totals
  // Total received = from college + deducted from student + deducted by agent - paid back to college
  // If you deduct ₹1000 as SC but then pay that ₹1000 to college, net SC received = 0
  const grossReceived = 
    (this.serviceCharge.receivedFromCollege || 0) +
    (this.serviceCharge.deductedFromStudent || 0) +
    (this.serviceCharge.deductedByAgent || 0);
  
  const paidBack = this.serviceCharge.paidBackToCollege || 0;
  
  this.serviceCharge.received = Math.max(0, grossReceived - paidBack);

  // Service charge due = agreed - net received
  this.serviceCharge.due = Math.max(0,
    (this.serviceCharge.agreed || 0) - (this.serviceCharge.received || 0));

  // Calculate college payment tracking
  // When student pays to consultancy, consultancy owes college the amount minus service charge
  // totalDueToCollege = what student paid to consultancy - service charge deducted
  // This is set by the payment service when processing payments

  // Balance due to college
  this.collegePayment.balanceDueToCollege = Math.max(0,
    (this.collegePayment.totalDueToCollege || 0) -
    (this.collegePayment.paidToCollege || 0));

  // Calculate student due
  this.paymentSummary.studentDue = Math.max(0,
    fees.totalFee - (this.paymentSummary.studentPaid || 0));

  // Calculate agent due - use multiple agents if available, otherwise legacy agent
  const totalAgentFee = this.agents?.totalAgentFee || this.agent?.agentFee || 0;
  this.paymentSummary.agentDue = Math.max(0,
    totalAgentFee - (this.paymentSummary.agentPaid || 0));

  next();
});

// Virtual for student full name
admissionSchema.virtual('studentFullName').get(function () {
  return `${this.student.firstName} ${this.student.lastName}`;
});

// Indexes
admissionSchema.index({ admissionNo: 1 });
admissionSchema.index({ branchId: 1 });
admissionSchema.index({ admissionStatus: 1 });
admissionSchema.index({ admissionDate: -1 });
admissionSchema.index({ collegeId: 1 });
admissionSchema.index({ courseId: 1 });
admissionSchema.index({ 'student.phone': 1 });
admissionSchema.index({ 'agent.agentId': 1 });
admissionSchema.index({ isDeleted: 1 });
admissionSchema.index({
  'student.firstName': 'text',
  'student.lastName': 'text',
  'student.email': 'text',
  'student.phone': 'text',
  admissionNo: 'text',
});

admissionSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Admission', admissionSchema);
