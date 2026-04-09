const mongoose = require('mongoose');

const profitPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be positive'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Bank'],
      default: 'Cash',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

profitPaymentSchema.index({ userId: 1 });
profitPaymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('ProfitPayment', profitPaymentSchema);
