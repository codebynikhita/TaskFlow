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
