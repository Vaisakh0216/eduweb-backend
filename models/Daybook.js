// const mongoose = require("mongoose");
// const { DAYBOOK_TYPES, DAYBOOK_CATEGORIES } = require("../utils/constants");

// const daybookSchema = new mongoose.Schema(
//   {
//     date: {
//       type: Date,
//       required: [true, "Date is required"],
//       default: Date.now,
//     },
//     branchId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Branch",
//       required: [true, "Branch is required"],
//     },
//     category: {
//       type: String,
//       enum: DAYBOOK_CATEGORIES,
//       required: [true, "Category is required"],
//     },
//     type: {
//       type: String,
//       enum: Object.values(DAYBOOK_TYPES),
//       required: [true, "Type (income/expense) is required"],
//     },
//     amount: {
//       type: Number,
//       required: [true, "Amount is required"],
//       min: [0, "Amount must be positive"],
//     },
//     dueAmount: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     description: String,
//     remarks: String,
//     transactionRef: {
//       type: String,
//       trim: true,
//     },
//     // Reference links
//     admissionId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Admission",
//     },
//     paymentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Payment",
//     },
//     agentPaymentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "AgentPayment",
//     },
//     voucherId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Voucher",
//     },
//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//     deletedAt: Date,
//     deletedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     updatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexes
// daybookSchema.index({ date: -1 });
// daybookSchema.index({ branchId: 1 });
// daybookSchema.index({ category: 1 });
// daybookSchema.index({ type: 1 });
// daybookSchema.index({ isDeleted: 1 });

// daybookSchema.pre(/^find/, function (next) {
//   if (!this.getOptions().includeDeleted) {
//     this.where({ isDeleted: false });
//   }
//   next();
// });

// module.exports = mongoose.model("Daybook", daybookSchema);

const mongoose = require("mongoose");
const { DAYBOOK_CATEGORIES } = require("../utils/constants");

const daybookSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },
    category: {
      type: String,
      enum: DAYBOOK_CATEGORIES,
      required: [true, "Category is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    description: String,
    remarks: String,
    transactionRef: {
      type: String,
      trim: true,
    },
    // Paid To - for salary category (employee name)
    paidTo: {
      type: String,
      trim: true,
    },
    // Bill/Receipt attachments
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        mimeType: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Reference links
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    agentPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentPayment",
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
daybookSchema.index({ date: -1 });
daybookSchema.index({ branchId: 1 });
daybookSchema.index({ category: 1 });
daybookSchema.index({ isDeleted: 1 });

daybookSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model("Daybook", daybookSchema);
