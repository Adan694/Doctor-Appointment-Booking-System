const sendEmail = require('./sendEmail');
const Notification = require('../models/Notification');

const notifyAll = async ({ patient, doctor, admin, message }) => {
  const users = [patient, doctor, admin];

  for (const user of users) {
    if (!user || !user._id || !user.email || !user.role) {
      console.warn('⚠ Skipped notification: missing user info.');
      continue;
    }

    // Save to MongoDB
    await Notification.create({
      userId: user._id,
      message
    });

    // Terminal log
console.log(`🔔 Notification to ${user.role.toUpperCase()} (${user.email}): \n${message}`);

    // Email
    await sendEmail(user.email, 'Appointment Notification', message);
  }
};

module.exports = notifyAll;