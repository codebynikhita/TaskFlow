const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const { isConfigured, cloudinary } = require('../config/cloudinary');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const { BadRequestError, UnauthorizedError } = require('../utils/apiErrors');
const logger = require('../utils/logger');

// Set cookie parameters for Refresh Token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new BadRequestError('Email is already registered'));
    }

    // Set first registered user as Admin, otherwise User
    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? 'Admin' : 'User';

    const user = new User({
      name,
      email,
      password,
      role
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    // Log action
    await ActivityLog.create({
      userId: user._id,
      action: 'User Registered'
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      status: 'success',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return next(new UnauthorizedError('Incorrect email or password'));
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    // Log action
    await ActivityLog.create({
      userId: user._id,
      action: 'User Login'
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new UnauthorizedError('Refresh token not found in cookies'));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return next(new UnauthorizedError('Invalid refresh token'));
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken
      }
    });
  } catch (error) {
    return next(new UnauthorizedError('Refresh token verification failed'));
  }
};

const logout = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user) {
          user.refreshToken = '';
          await user.save();
        }
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

const uploadAvatar = async (req, res, next) => {
  const { image } = req.body; // Expecting base64 image data URI

  if (!image) {
    return next(new BadRequestError('Image payload is required'));
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new BadRequestError('User not found'));
    }

    if (isConfigured) {
      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'taskflow_avatars',
        transformation: [{ width: 150, height: 150, crop: 'fill' }]
      });
      user.avatar = uploadResponse.secure_url;
    } else {
      // Fallback: save base64 data URI directly to DB
      logger.info('Saving avatar as base64 in database.');
      user.avatar = image;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  uploadAvatar
};
