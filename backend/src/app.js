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
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: allowedOrigins,
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
