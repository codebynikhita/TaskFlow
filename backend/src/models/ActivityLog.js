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
