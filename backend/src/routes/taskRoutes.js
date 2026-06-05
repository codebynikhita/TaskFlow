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
