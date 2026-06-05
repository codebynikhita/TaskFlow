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
