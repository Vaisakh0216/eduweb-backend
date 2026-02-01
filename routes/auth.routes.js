const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate, validate } = require('../middlewares');
const { auth: authValidator } = require('../validators');

// Public routes
router.post('/login', validate(authValidator.loginSchema), authController.login);
router.post('/refresh-token', validate(authValidator.refreshTokenSchema), authController.refreshToken);

// Protected routes
router.use(authenticate);
router.post('/logout', authController.logout);
router.post('/change-password', validate(authValidator.changePasswordSchema), authController.changePassword);
router.get('/profile', authController.getProfile);

module.exports = router;
