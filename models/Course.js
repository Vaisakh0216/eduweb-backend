const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College is required'],
    },
    duration: {
      years: {
        type: Number,
        default: 4,
      },
      description: String,
    },
    degree: {
      type: String,
      trim: true,
    },
    specialization: String,
    fees: {
      year1: { type: Number, default: 0 },
      year2: { type: Number, default: 0 },
      year3: { type: Number, default: 0 },
      year4: { type: Number, default: 0 },
    },
    hostelFees: {
      year1: { type: Number, default: 0 },
      year2: { type: Number, default: 0 },
      year3: { type: Number, default: 0 },
      year4: { type: Number, default: 0 },
    },
    description: String,
    eligibility: String,
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

courseSchema.index({ name: 'text' });
courseSchema.index({ collegeId: 1 });
courseSchema.index({ isActive: 1, isDeleted: 1 });

courseSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
