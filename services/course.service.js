const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { getPaginationOptions, formatPaginationResponse, cleanObject } = require('../utils/helpers');

class CourseService {
  async create(data, createdBy) {
    const course = await Course.create({
      ...data,
      createdBy,
    });

    return course;
  }

  async findAll(query) {
    const { page, limit, skip } = getPaginationOptions(query);
    const filter = {};

    // Search
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { degree: searchRegex },
      ];
    }

    // Filter by college
    if (query.collegeId) {
      filter.collegeId = query.collegeId;
    }

    // Filter by status
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('collegeId', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    return formatPaginationResponse(courses, total, page, limit);
  }

  async findByCollege(collegeId) {
    return Course.find({ collegeId, isActive: true, isDeleted: false })
      .select('name code degree duration fees hostelFees')
      .sort({ name: 1 });
  }

  async findById(id) {
    const course = await Course.findById(id)
      .populate('collegeId', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    return course;
  }

  async update(id, data, updatedBy) {
    const course = await Course.findById(id);

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { ...cleanObject(data), updatedBy },
      { new: true, runValidators: true }
    ).populate('collegeId', 'name code');

    return updatedCourse;
  }

  async delete(id, deletedBy) {
    const course = await Course.findById(id);

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    course.isDeleted = true;
    course.deletedAt = new Date();
    course.deletedBy = deletedBy;
    await course.save();

    return true;
  }
}

module.exports = new CourseService();
