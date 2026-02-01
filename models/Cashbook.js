const mongoose = require('mongoose');
const { DAYBOOK_CATEGORIES } = require('../utils/constants');

const cashbookSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    category: {
      type: String,
      enum: DAYBOOK_CATEGORIES,
      required: [true, 'Category is required'],
    },
    description: String,
    credited: {
      type: Number,
      default: 0,
      min: 0,
    },
    debited: {
      type: Number,
      default: 0,
      min: 0,
    },
    runningBalance: {
      type: Number,
      default: 0,
    },
    remarks: String,
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
    },
    daybookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Daybook',
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
cashbookSchema.index({ date: -1 });
cashbookSchema.index({ branchId: 1 });
cashbookSchema.index({ isDeleted: 1 });

cashbookSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Cashbook', cashbookSchema);
