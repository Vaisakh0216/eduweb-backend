const User = require('../models/User');
const AppError = require('../utils/AppError');
const { getPaginationOptions, formatPaginationResponse, cleanObject } = require('../utils/helpers');
const { ROLES } = require('../utils/constants');

class UserService {
  async create(data, createdBy) {
    // Check if email exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    const user = await User.create({
      ...data,
      createdBy,
    });

    return user;
  }

  async findAll(query, currentUser) {
    const { page, limit, skip } = getPaginationOptions(query);
    const filter = { isActive: true };

    // Search
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by role
    if (query.role) {
      filter.role = query.role;
    }

    // Filter by status
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    // Non-super admin can only see users from their branches
    if (currentUser.role !== ROLES.SUPER_ADMIN) {
      filter.branches = { $in: currentUser.branches.map((b) => b._id) };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('branches', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return formatPaginationResponse(users, total, page, limit);
  }

  async findById(id) {
    const user = await User.findById(id)
      .populate('branches', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async update(id, data, updatedBy) {
    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check email uniqueness if changing
    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new AppError('Email already exists', 400);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...cleanObject(data), updatedBy },
      { new: true, runValidators: true }
    ).populate('branches', 'name code');

    return updatedUser;
  }

  async toggleStatus(id, updatedBy) {
    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = !user.isActive;
    user.updatedBy = updatedBy;
    await user.save();

    return user;
  }

  async delete(id) {
    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      throw new AppError('Cannot delete super admin', 400);
    }

    await User.findByIdAndDelete(id);
    return true;
  }
}

module.exports = new UserService();
