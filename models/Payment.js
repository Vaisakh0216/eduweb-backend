const mongoose = require('mongoose');
const {
  PAYER_TYPES,
  RECEIVER_TYPES,
  PAYMENT_MODES,
} = require('../utils/constants');

const paymentSchema = new mongoose.Schema(
  {
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
      required: [true, 'Admission is required'],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    payerType: {
      type: String,
      enum: Object.values(PAYER_TYPES),
      required: [true, 'Payer type is required'],
    },
    receiverType: {
      type: String,
      enum: Object.values(RECEIVER_TYPES),
      required: [true, 'Receiver type is required'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      required: [true, 'Payment mode is required'],
    },
    transactionRef: {
      type: String,
      sparse: true,
      trim: true,
    },
    notes: String,
    // Attachment (image or PDF)
    attachment: {
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      path: String,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
    },
    // Service charge payment tracking
    isServiceChargePayment: {
      type: Boolean,
      default: false,
    },
    // When Student pays to Consultancy, track service charge deduction
    serviceChargeDeducted: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Amount that needs to be paid to college from this payment
    amountDueToCollege: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Agent collection flow fields
    isAgentCollection: {
      type: Boolean,
      default: false,
    },
    collectingAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    agentFeeDeducted: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountTransferredToConsultancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    // For agent fee payment from consultancy to agent
    isAgentFeePayment: {
      type: Boolean,
      default: false,
    },
    agentIdForFeePayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    // Track which specific agent was paid (for multiple agents)
    paidToAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
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
  }
);

// Indexes
paymentSchema.index({ admissionId: 1 });
paymentSchema.index({ branchId: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ payerType: 1, receiverType: 1 });
paymentSchema.index({ isDeleted: 1 });
paymentSchema.index({ transactionRef: 1 }, { unique: true, sparse: true });
paymentSchema.index({ paidToAgentId: 1 });

paymentSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
