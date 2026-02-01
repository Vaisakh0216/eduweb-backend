const Branch = require('../models/Branch');
const AppError = require('../utils/AppError');
const { getPaginationOptions, formatPaginationResponse, cleanObject } = require('../utils/helpers');

class BranchService {
  async create(data, createdBy) {
    // Check if code exists
    const existingBranch = await Branch.findOne({ code: data.code });
    if (existingBranch) {
      throw new AppError('Branch code already exists', 400);
    }

    const branch = await Branch.create({
      ...data,
      createdBy,
    });

    return branch;
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
      ];
    }

    // Filter by status
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const [branches, total] = await Promise.all([
      Branch.find(filter)
        .populate('managerId', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Branch.countDocuments(filter),
    ]);

    return formatPaginationResponse(branches, total, page, limit);
  }

  async findAllActive() {
    return Branch.find({ isActive: true, isDeleted: false })
      .select('name code')
      .sort({ name: 1 });
  }

  async findById(id) {
    const branch = await Branch.findById(id)
      .populate('managerId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    if (!branch) {
      throw new AppError('Branch not found', 404);
    }

    return branch;
  }

  async update(id, data, updatedBy) {
    const branch = await Branch.findById(id);

    if (!branch) {
      throw new AppError('Branch not found', 404);
    }

    // Check code uniqueness if changing
    if (data.code && data.code !== branch.code) {
      const existingBranch = await Branch.findOne({ code: data.code });
      if (existingBranch) {
        throw new AppError('Branch code already exists', 400);
      }
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { ...cleanObject(data), updatedBy },
      { new: true, runValidators: true }
    );

    return updatedBranch;
  }

  async delete(id, deletedBy) {
    const branch = await Branch.findById(id);

    if (!branch) {
      throw new AppError('Branch not found', 404);
    }

    // Soft delete
    branch.isDeleted = true;
    branch.deletedAt = new Date();
    branch.deletedBy = deletedBy;
    await branch.save();

    return true;
  }
}

module.exports = new BranchService();
