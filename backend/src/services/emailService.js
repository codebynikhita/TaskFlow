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
