const express = require('express');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  uploadAvatar
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public auth routes (with rate limiting and payload validation)
router.post('/register', authLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes (require JWT verification)
router.get('/me', protect, getMe);
router.post('/avatar', protect, uploadAvatar);

module.exports = router;
