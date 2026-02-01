const authService = require('../services/auth.service');
const { createAuditLog } = require('../middlewares/auditLog');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const result = await authService.login(email, password);

    // Audit log
    await createAuditLog({
      userId: result.user._id,
      action: 'login',
      entityType: 'User',
      entityId: result.user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.validatedBody;
    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id);

    // Audit log
    await createAuditLog({
      userId: req.user._id,
      action: 'logout',
      entityType: 'User',
      entityId: req.user._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validatedBody;
    await authService.changePassword(req.user._id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  changePassword,
  getProfile,
};
