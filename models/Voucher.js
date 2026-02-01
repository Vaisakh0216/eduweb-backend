const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    voucherNo: {
      type: String,
      unique: true,
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    voucherDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    voucherType: {
      type: String,
      enum: ['receipt', 'payment', 'agent_payment', 'expense'],
      required: true,
      // receipt = money received (income)
      // payment = money paid out (expense)
    },
    referenceType: {
      type: String,
      enum: ['Payment', 'AgentPayment', 'DaybookEntry', 'Daybook'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceType',
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: String,
    transactionRef: String,
    description: String,
    partyName: String,
    partyType: String,
    notes: String,
    printCount: {
      type: Number,
      default: 0,
    },
    lastPrintedAt: Date,
    lastPrintedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
voucherSchema.index({ voucherNo: 1 });
voucherSchema.index({ branchId: 1 });
voucherSchema.index({ voucherDate: -1 });
voucherSchema.index({ voucherType: 1 });
voucherSchema.index({ referenceId: 1 });
voucherSchema.index({ admissionId: 1 });
voucherSchema.index({ isDeleted: 1 });

voucherSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Voucher', voucherSchema);
