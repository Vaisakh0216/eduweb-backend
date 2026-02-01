const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      addressLine: String,
      city: String,
      district: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    phone: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    website: String,
    contactPerson: {
      name: String,
      phone: String,
      email: String,
      designation: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
    },
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
  }
);

collegeSchema.index({ name: 'text' });
collegeSchema.index({ code: 1 });
collegeSchema.index({ isActive: 1, isDeleted: 1 });

collegeSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('College', collegeSchema);
