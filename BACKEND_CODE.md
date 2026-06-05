# TaskFlow Backend — Complete Source Code

---
## `backend/.env`
```env
# Port Configuration
PORT=5001

# MongoDB Connection String
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow

# JWT Secrets (use strong random strings in production)
JWT_ACCESS_SECRET=taskflow_jwt_access_super_secret_key_2026
JWT_REFRESH_SECRET=taskflow_jwt_refresh_super_secret_key_2026

# JWT Expiry Settings
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email SMTP Settings (For due-date reminders, fallback to console if not specified)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@taskflow.com

# Cloudinary Config (For avatar uploads, fallback to local filesystem uploads if not configured)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---
## `backend/package.json`
```json
{
  "name": "taskflow-backend",
  "version": "1.0.0",
  "description": "Backend API for TaskFlow task management application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "csv-writer": "^1.6.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.0",
    "morgan": "^1.10.0",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.13",
    "pdfkit": "^0.15.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---
## `backend/server.js`
```javascript
// Handle uncaught exceptions before running any imports
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
// Start the due date reminder background checks
require('./src/services/emailService');

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down gracefully...');
  logger.error(`${err.name}: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
```

---
## `backend/src/app.js`
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorMiddleware');
const { NotFoundError } = require('./utils/apiErrors');

const app = express();

// Set security headers
app.use(helmet());

// Configure CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logger
app.use(morgan('dev'));

// Body parsing (support up to 5mb for base64 avatar uploads)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Cookie parser
app.use(cookieParser());

// Custom NoSQL Injection Protection middleware (strips keys starting with $)
const nosqlSanitizer = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};
app.use(nosqlSanitizer);

// Apply API Rate Limiter
app.use('/api', apiLimiter);

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Capture 404s
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
```

---
## `backend/src/config/db.js`
```javascript
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow');
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---
## `backend/src/config/cloudinary.js`
```javascript
const logger = require('../utils/logger');

let cloudinary = null;
let isConfigured = false;

try {
  const cloudinaryModule = require('cloudinary');
  cloudinary = cloudinaryModule.v2;

  isConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    logger.info('Cloudinary configured successfully.');
  } else {
    logger.warn('Cloudinary environment variables missing. Falling back to local file upload.');
  }
} catch (err) {
  logger.warn('Cloudinary package not installed. Avatar uploads will save as base64 in database.');
}

module.exports = {
  cloudinary,
  isConfigured
};
```

---
## `backend/src/models/User.js`
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [3, 'Name must be at least 3 characters'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
  },
  refreshToken: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to hash the password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare candidate password with hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

---
## `backend/src/models/Task.js`
```javascript
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Completed'],
    default: 'Todo'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set timestamps and indexing
TaskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexing for search, filtering, and pagination
TaskSchema.index({ user: 1, isDeleted: 1, status: 1, priority: 1, dueDate: 1 });
TaskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', TaskSchema);
```

---
## `backend/src/models/ActivityLog.js`
```javascript
const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index logs by userId and timestamp for high performance queries
ActivityLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
```

---
## `backend/src/middleware/authMiddleware.js`
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/apiErrors');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new UnauthorizedError('Not authorized, no token provided'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Fetch user and exclude password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists'));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return next(new UnauthorizedError('Not authorized, token failed'));
  }
};

module.exports = { protect };
```

---
## `backend/src/middleware/errorMiddleware.js`
```javascript
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    return res.status(400).json({
      status: 'fail',
      message: `Duplicate field value: ${value}. Please use another value!`
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Your token has expired. Please log in again.'
    });
  }

  // Production response (do not leak stack details)
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went wrong on the server'
  });
};

module.exports = errorHandler;
```

---
## `backend/src/middleware/roleMiddleware.js`
```javascript
const { ForbiddenError } = require('../utils/apiErrors');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User context missing. Make sure route is protected first.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `User role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
```

---
## `backend/src/middleware/rateLimiter.js`
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 authentication requests per window
  message: {
    status: 'fail',
    message: 'Too many authentication attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter
};
```

---
## `backend/src/validators/authValidator.js`
```javascript
const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/apiErrors');

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join('; ');
    return next(new BadRequestError(errorMessages));
  }
  next();
};

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  validateResult
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateResult
];

module.exports = {
  registerValidator,
  loginValidator
};
```

---
## `backend/src/validators/taskValidator.js`
```javascript
const { body, validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/apiErrors');

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join('; ');
    return next(new BadRequestError(errorMessages));
  }
  next();
};

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Priority must be either Low, Medium, or High'),
  body('status')
    .optional()
    .isIn(['Todo', 'In Progress', 'Completed']).withMessage('Status must be either Todo, In Progress, or Completed'),
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Due date must be a valid ISO8601 date'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array of strings'),
  body('tags.*')
    .optional()
    .trim()
    .isString().withMessage('Each tag must be a string'),
  validateResult
];

const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Task title cannot be empty')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Priority must be either Low, Medium, or High'),
  body('status')
    .optional()
    .isIn(['Todo', 'In Progress', 'Completed']).withMessage('Status must be either Todo, In Progress, or Completed'),
  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid ISO8601 date'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array of strings'),
  body('tags.*')
    .optional()
    .trim()
    .isString().withMessage('Each tag must be a string'),
  validateResult
];

module.exports = {
  createTaskValidator,
  updateTaskValidator
};
```

---
## `backend/src/controllers/authController.js`
```javascript
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
```

---
## `backend/src/controllers/taskController.js`
```javascript
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { exportToCsv, exportToPdf } = require('../services/exportService');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/apiErrors');

const createTask = async (req, res, next) => {
  const { title, description, priority, status, dueDate, tags } = req.body;

  try {
    const task = new Task({
      title,
      description,
      priority,
      status,
      dueDate,
      tags,
      user: req.user._id
    });

    await task.save();

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      action: `Task Created: ${task.title}`
    });

    res.status(201).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const query = { user: req.user._id, isDeleted: false };

    // Apply Priority & Status filters
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Apply Search
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Apply Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Apply Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: order };

    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      pagination: {
        totalTasks,
        totalPages,
        currentPage: page,
        limit
      },
      data: {
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSingleTask = async (req, res, next) => {
  const { id } = req.params;

  try {
    const task = await Task.findOne({ _id: id, isDeleted: false });

    if (!task) {
      return next(new NotFoundError('Task not found'));
    }

    // Check ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return next(new ForbiddenError('You do not have permission to view this task'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  const { id } = req.params;

  try {
    let task = await Task.findOne({ _id: id, isDeleted: false });

    if (!task) {
      return next(new NotFoundError('Task not found'));
    }

    // Check ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return next(new ForbiddenError('You do not have permission to update this task'));
    }

    // List of allowed update fields
    const updates = ['title', 'description', 'priority', 'status', 'dueDate', 'tags'];
    updates.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      action: `Task Updated: ${task.title}`
    });

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  const { id } = req.params;

  try {
    const task = await Task.findOne({ _id: id, isDeleted: false });

    if (!task) {
      return next(new NotFoundError('Task not found'));
    }

    // Check ownership (Admins can delete any task, Users only their own)
    if (task.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return next(new ForbiddenError('You do not have permission to delete this task'));
    }

    // Soft delete
    task.isDeleted = true;
    await task.save();

    // Log Activity
    await ActivityLog.create({
      userId: req.user._id,
      action: `Task Deleted: ${task.title}`
    });

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
    const csvContent = exportToCsv(tasks);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=taskflow_tasks.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

const exportPdf = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user._id, isDeleted: false }).sort({ createdAt: -1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=taskflow_tasks.pdf');

    exportToPdf(tasks, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getSingleTask,
  updateTask,
  deleteTask,
  exportCsv,
  exportPdf
};
```

---
## `backend/src/controllers/dashboardController.js`
```javascript
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

const getDashboardStats = async (req, res, next) => {
  const userId = req.user._id;

  try {
    // Run counting in parallel for maximum query performance
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      recentLogs
    ] = await Promise.all([
      Task.countDocuments({ user: userId, isDeleted: false }),
      Task.countDocuments({ user: userId, isDeleted: false, status: 'Completed' }),
      Task.countDocuments({ user: userId, isDeleted: false, status: 'Todo' }),
      Task.countDocuments({ user: userId, isDeleted: false, status: 'In Progress' }),
      Task.countDocuments({ user: userId, isDeleted: false, priority: 'High' }),
      Task.countDocuments({ user: userId, isDeleted: false, priority: 'Medium' }),
      Task.countDocuments({ user: userId, isDeleted: false, priority: 'Low' }),
      ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(6)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalTasks,
        completedTasks,
        pendingTasks, // Maps to 'Todo' status
        inProgressTasks,
        highPriorityTasks,
        priorityDistribution: {
          low: lowPriorityTasks,
          medium: mediumPriorityTasks,
          high: highPriorityTasks
        },
        recentActivity: recentLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
```

---
## `backend/src/routes/authRoutes.js`
```javascript
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
```

---
## `backend/src/routes/taskRoutes.js`
```javascript
const express = require('express');
const {
  createTask,
  getTasks,
  getSingleTask,
  updateTask,
  deleteTask,
  exportCsv,
  exportPdf
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { createTaskValidator, updateTaskValidator } = require('../validators/taskValidator');

const router = express.Router();

// Apply protection middleware to all task routes
router.use(protect);

// CSV and PDF exports (needs to go before GET /:id so it's not matched as an id parameter)
router.get('/export/csv', exportCsv);
router.get('/export/pdf', exportPdf);

// Core CRUD APIs
router.post('/', createTaskValidator, createTask);
router.get('/', getTasks);
router.get('/:id', getSingleTask);
router.put('/:id', updateTaskValidator, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
```

---
## `backend/src/routes/dashboardRoutes.js`
```javascript
const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Fetch dashboard analytical details (Protected)
router.get('/', protect, getDashboardStats);

module.exports = router;
```

---
## `backend/src/services/emailService.js`
```javascript
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Task = require('../models/Task');
const logger = require('../utils/logger');

// Set up transporter
let transporter;

const setupTransporter = () => {
  const isMailConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (isMailConfigured) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    logger.info('Nodemailer SMTP transporter initialized.');
  } else {
    // Local / console fallback transport
    transporter = {
      sendMail: async (mailOptions) => {
        logger.info(`[MOCK EMAIL SENT]
To: ${mailOptions.to}
Subject: ${mailOptions.subject}
Body: ${mailOptions.text}
-------------------------------`);
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
    logger.warn('Nodemailer SMTP credentials missing. Using Mock Console transporter.');
  }
};

setupTransporter();

// Check tasks due within next 24 hours and send email alerts
const checkAndSendReminders = async () => {
  logger.info('Running due date task reminder service...');
  try {
    const now = new Date();
    const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Find tasks: not completed, not deleted, due between now and tomorrow, with user populated
    const tasks = await Task.find({
      isDeleted: false,
      status: { $ne: 'Completed' },
      dueDate: { $gte: now, $lte: targetTime }
    }).populate('user');

    logger.info(`Found ${tasks.length} tasks due within 24 hours.`);

    for (const task of tasks) {
      if (task.user && task.user.email) {
        const mailOptions = {
          from: process.env.EMAIL_FROM || 'reminders@taskflow.com',
          to: task.user.email,
          subject: `🔔 TaskFlow Reminder: Task "${task.title}" is due soon!`,
          text: `Hi ${task.user.name},

This is a reminder that your task "${task.title}" is due soon.

Task Details:
- Priority: ${task.priority}
- Status: ${task.status}
- Due Date: ${new Date(task.dueDate).toLocaleString()}
- Description: ${task.description || 'No description provided.'}

Please log in to TaskFlow to complete or update this task.

Best regards,
TaskFlow Team`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px;">
              <h2 style="color: #6366f1;">🔔 Task Due Reminder</h2>
              <p>Hi <strong>${task.user.name}</strong>,</p>
              <p>This is a reminder that your task "<strong>${task.title}</strong>" is due soon.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #f8fafc;">
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Priority</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; color: ${task.priority === 'High' ? '#ef4444' : '#f59e0b'};">${task.priority}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Status</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${task.status}</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Due Date</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date(task.dueDate).toLocaleString()}</td>
                </tr>
              </table>
              <p style="color: #475569; font-style: italic;">"${task.description || 'No description provided.'}"</p>
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                This is an automated message from TaskFlow. Please do not reply.
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Reminder email successfully sent for task: "${task.title}" to ${task.user.email}`);
      }
    }
  } catch (error) {
    logger.error(`Error in reminder service: ${error.message}`);
  }
};

// Schedule job to run once every day at 8:00 AM
// Format: minute hour day-of-month month day-of-week
cron.schedule('0 8 * * *', () => {
  checkAndSendReminders();
});

// Also schedule it to run every 15 minutes for mock/testing simulation visibility
cron.schedule('*/15 * * * *', () => {
  logger.info('[CRON] Running 15-minute verification check...');
  checkAndSendReminders();
});

module.exports = {
  checkAndSendReminders
};
```

---
## `backend/src/services/exportService.js`
```javascript
const PDFDocument = require('pdfkit');
const { createObjectCsvStringifier } = require('csv-writer');

const exportToCsv = (tasks) => {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'title', title: 'TITLE' },
      { id: 'description', title: 'DESCRIPTION' },
      { id: 'priority', title: 'PRIORITY' },
      { id: 'status', title: 'STATUS' },
      { id: 'dueDate', title: 'DUE DATE' },
      { id: 'tags', title: 'TAGS' },
      { id: 'createdAt', title: 'CREATED AT' },
    ]
  });

  const records = tasks.map(task => ({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    dueDate: new Date(task.dueDate).toISOString().split('T')[0],
    tags: task.tags ? task.tags.join(', ') : '',
    createdAt: new Date(task.createdAt).toISOString().split('T')[0]
  }));

  return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
};

const exportToPdf = (tasks, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to the response
  doc.pipe(res);

  // PDF Header Setup
  doc.fontSize(22).fillColor('#4f46e5').text('TaskFlow - Task Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cbd5e1').stroke();
  doc.moveDown();

  if (tasks.length === 0) {
    doc.moveDown(2);
    doc.fontSize(14).fillColor('#64748b').text('No tasks recorded for this report.', { align: 'center' });
  } else {
    tasks.forEach((task, index) => {
      // Keep sections together
      doc.fontSize(12).fillColor('#1e293b').text(`${index + 1}. ${task.title}`, { style: 'bold' });
      doc.moveDown(0.2);

      // Metadata
      doc.fontSize(9).fillColor('#475569')
         .text('Status: ', { continued: true }).fillColor('#0f172a').text(`${task.status}   |   `, { continued: true })
         .fillColor('#475569').text('Priority: ', { continued: true })
         .fillColor(task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#3b82f6')
         .text(`${task.priority}   |   `, { continued: true })
         .fillColor('#475569').text('Due Date: ', { continued: true })
         .fillColor('#0f172a').text(`${new Date(task.dueDate).toLocaleDateString()}`);
      doc.moveDown(0.3);

      // Description
      if (task.description) {
        doc.fontSize(9).fillColor('#64748b').text(task.description);
        doc.moveDown(0.3);
      }

      // Tags
      if (task.tags && task.tags.length > 0) {
        doc.fontSize(8).fillColor('#6366f1').text(`Tags: ${task.tags.join(', ')}`);
      }

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#f1f5f9').stroke();
      doc.moveDown(0.5);
    });
  }

  doc.end();
};

module.exports = {
  exportToCsv,
  exportToPdf
};
```

---
## `backend/src/utils/apiErrors.js`
```javascript
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized access') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden action') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};
```

---
## `backend/src/utils/logger.js`
```javascript
const info = (msg) => {
  console.log(`[INFO] ${new Date().toISOString()}: ${msg}`);
};

const error = (msg) => {
  console.error(`[ERROR] ${new Date().toISOString()}: ${msg}`);
};

const warn = (msg) => {
  console.warn(`[WARN] ${new Date().toISOString()}: ${msg}`);
};

module.exports = { info, error, warn };
```

---
## `backend/src/utils/token.js`
```javascript
const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};
```
