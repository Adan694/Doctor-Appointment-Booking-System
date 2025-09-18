const sendEmail = require('./sendEmail');
const Notification = require('../models/Notification');

const notifyAll = async ({ patient, doctor, admin, message, type }) => {
  const users = [patient, doctor, admin];

  for (const user of users) {
    if (!user || !user._id || !user.email || !user.role) continue;

    try {
      const isUnread = type === 'feedback' ? false : undefined; 

      // Save to MongoDB
      const saved = await Notification.create({
        userId: user._id,
        message,
        ...(isUnread !== undefined && { isRead: isUnread }),
        createdAt: new Date()
      });

      // Send email
      await sendEmail(user.email, 'Appointment Notification', message);

    } catch (err) {
      console.error(`Failed to notify ${user?.role || 'unknown'}:`, err);
    }
  }
};

module.exports = notifyAll;
