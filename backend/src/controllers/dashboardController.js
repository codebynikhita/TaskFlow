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
