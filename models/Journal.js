const mongoose = require('mongoose');
const { JOURNAL_TYPES, JOURNAL_STATUSES } = require('../utils/constants');

const journalSchema = new mongoose.Schema(
  {
    journalNo: {
      type: String,
      unique: true,
    },
    journalDate: {
      type: Date,
      required: [true, 'Journal date is required'],
      default: Date.now,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    type: {
      type: String,
      enum: Object.values(JOURNAL_TYPES),
      required: [true, 'Journal type is required'],
    },
    // Optional — not all adjustments are tied to a specific admission
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
    },
    // Optional — only relevant for agent-type entries
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Description is required'],
    },
    // 'pending'/'settled' only for sc_collected_by_agent; others use 'completed'
    status: {
      type: String,
      enum: Object.values(JOURNAL_STATUSES),
      default: JOURNAL_STATUSES.COMPLETED,
    },
    settledAt: Date,
    // Reference to payment that settled this entry (for sc_collected_by_agent)
    settledPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
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
  { timestamps: true }
);

journalSchema.pre('save', async function (next) {
  if (this.isNew && !this.journalNo) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    });
    this.journalNo = `JNL-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  // sc_collected_by_agent starts as pending; all others start as completed
  if (this.isNew && !this.status) {
    const { JOURNAL_TYPES: JT, JOURNAL_STATUSES: JS } = require('../utils/constants');
    this.status = this.type === JT.SC_COLLECTED_BY_AGENT ? JS.PENDING : JS.COMPLETED;
  }
  next();
});

journalSchema.index({ admissionId: 1 });
journalSchema.index({ agentId: 1 });
journalSchema.index({ branchId: 1 });
journalSchema.index({ type: 1 });
journalSchema.index({ status: 1 });
journalSchema.index({ journalDate: -1 });
journalSchema.index({ isDeleted: 1 });

journalSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Journal', journalSchema);
