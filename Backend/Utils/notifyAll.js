const sendEmail = require('./sendEmail');
const Notification = require('../models/Notification');

const notifyAll = async ({ patient, doctor, admin, message }) => {
  console.log("🔔 notifyAll called with:", {
    hasPatient: !!patient,
    patientInfo: patient ? { _id: patient._id, email: patient.email, role: patient.role } : null,
    hasDoctor: !!doctor,
    doctorInfo: doctor ? { _id: doctor._id, email: doctor.email, role: doctor.role } : null,
    hasAdmin: !!admin,
    adminInfo: admin ? { _id: admin._id, email: admin.email, role: admin.role } : null,
    messagePreview: message?.substring(0, 50) + '...'
  });

  const users = [patient, doctor, admin];

  for (const user of users) {
    console.log("➡ Processing user:", user);

    if (!user || !user._id || !user.email || !user.role) {
      console.warn('⚠ Skipped notification: missing user info.', {
        hasId: !!user?._id,
        hasEmail: !!user?.email,
        hasRole: !!user?.role
      });
      continue;
    }

    try {
      // Save to MongoDB
      const saved = await Notification.create({
        userId: user._id,
        message
      });
      console.log(`💾 Notification saved in DB for ${user.role} (${user.email}) -> ID: ${saved._id}`);

      // Terminal log
      console.log(`📢 Notification to ${user.role.toUpperCase()} (${user.email}): \n${message}`);

      // Email
      await sendEmail(user.email, 'Appointment Notification', message);
      console.log(`✅ Email sent to ${user.role} (${user.email})`);

    } catch (err) {
      console.error(`❌ Failed to notify ${user?.role || 'unknown'} (${user?.email || 'no email'}):`, err);
    }
  }
};

module.exports = notifyAll;
