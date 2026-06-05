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
