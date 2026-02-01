const mongoose = require('mongoose');
const { AGENT_TYPES } = require('../utils/constants');

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
    },
    agentType: {
      type: String,
      enum: Object.values(AGENT_TYPES),
      required: [true, 'Agent type is required'],
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      addressLine: String,
      city: String,
      district: String,
      state: String,
      pincode: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      upiId: String,
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    parentAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    linkedColleges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
    }],
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

agentSchema.index({ name: 'text' });
agentSchema.index({ agentType: 1 });
agentSchema.index({ isActive: 1, isDeleted: 1 });

agentSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Agent', agentSchema);
