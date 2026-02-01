const College = require('../models/College');
const AppError = require('../utils/AppError');
const { getPaginationOptions, formatPaginationResponse, cleanObject } = require('../utils/helpers');

class CollegeService {
  async create(data, createdBy) {
    if (data.code) {
      const existingCollege = await College.findOne({ code: data.code });
      if (existingCollege) {
        throw new AppError('College code already exists', 400);
      }
    }

    const college = await College.create({
      ...data,
      createdBy,
    });

    return college;
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
        { 'address.city': searchRegex },
        { 'address.state': searchRegex },
      ];
    }

    // Filter by status
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const [colleges, total] = await Promise.all([
      College.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      College.countDocuments(filter),
    ]);

    return formatPaginationResponse(colleges, total, page, limit);
  }

  async findAllActive() {
    return College.find({ isActive: true, isDeleted: false })
      .select('name code address.city')
      .sort({ name: 1 });
  }

  async findById(id) {
    const college = await College.findById(id)
      .populate('createdBy', 'firstName lastName');

    if (!college) {
      throw new AppError('College not found', 404);
    }

    return college;
  }

  async update(id, data, updatedBy) {
    const college = await College.findById(id);

    if (!college) {
      throw new AppError('College not found', 404);
    }

    if (data.code && data.code !== college.code) {
      const existingCollege = await College.findOne({ code: data.code });
      if (existingCollege) {
        throw new AppError('College code already exists', 400);
      }
    }

    const updatedCollege = await College.findByIdAndUpdate(
      id,
      { ...cleanObject(data), updatedBy },
      { new: true, runValidators: true }
    );

    return updatedCollege;
  }

  async delete(id, deletedBy) {
    const college = await College.findById(id);

    if (!college) {
      throw new AppError('College not found', 404);
    }

    college.isDeleted = true;
    college.deletedAt = new Date();
    college.deletedBy = deletedBy;
    await college.save();

    return true;
  }
}

module.exports = new CollegeService();
