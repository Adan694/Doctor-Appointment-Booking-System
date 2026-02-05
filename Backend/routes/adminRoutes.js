const express = require('express');
const { User } = require('../models/users');
const Doctor = require('../models/doctors');
const Chat = require('../models/chat'); // adjust path to your Chat model

const {
  deactivatePatient,
  activatePatient,
  getAdminProfile,
  getPatientById,
  getAppointmentsByPatientId,
  getAllPatients,
  deletePatient,
  getTotalUsers,
  getTodaysAppointments,
  getFeedbackAlerts,
  getLatestBookings,
  getCurrentAdminProfile,
  getUserCounts,
  getTotalAppointmentsCount,
  getPatientsTimeSeries,
  getDoctorsTimeSeries,
  getAppointmentsTimeSeries,
  updateAdminProfile,
  updateAdminPassword
} = require('../Controllers/AdminController');

const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');
const router = express.Router();
router.use((req, res, next) => {
  console.log(`[Admin Route] ${req.method} ${req.originalUrl}`);
  next();
});
// ----------------- PROFILE ROUTES -----------------
router.get('/profile', authenticateToken, authorizeAdmin, (req, res, next) => {
  console.log('GET /profile called');
  next();
}, getCurrentAdminProfile);

router.put('/profile', authenticateToken, authorizeAdmin, (req, res, next) => {
  console.log('PUT /profile called');
  next();
}, updateAdminProfile);

router.put('/profile/change-password', authenticateToken, authorizeAdmin, (req, res, next) => {
  console.log('PUT /profile/change-password called');
  next();
}, updateAdminPassword);

// ----------------- PATIENT ROUTES -----------------
router.get('/patients', authenticateToken, authorizeAdmin, getAllPatients);
router.get('/patients/:id', getPatientById);
router.get('/patients/:id/appointments', getAppointmentsByPatientId);
router.patch("/patients/:id/deactivate", authenticateToken, authorizeAdmin, deactivatePatient);
router.patch("/patients/:id/activate", authenticateToken, authorizeAdmin, activatePatient);
router.delete('/patients/:id', authenticateToken, authorizeAdmin, deletePatient);

// ----------------- DASHBOARD ROUTES -----------------
router.get('/dashboard/total-users', authenticateToken, authorizeAdmin, getTotalUsers);
router.get('/dashboard/user-counts', authenticateToken, authorizeAdmin, getUserCounts);
router.get('/dashboard/todays-appointments', authenticateToken, authorizeAdmin, getTodaysAppointments);
router.get('/dashboard/feedback-alerts', authenticateToken, authorizeAdmin, getFeedbackAlerts);
router.get('/dashboard/latest-bookings', authenticateToken, authorizeAdmin, getLatestBookings);
router.get('/dashboard/total-appointments', authenticateToken, authorizeAdmin, getTotalAppointmentsCount);
router.get('/dashboard/patients-time-series', authenticateToken, authorizeAdmin, getPatientsTimeSeries);
router.get('/dashboard/doctors-time-series', authenticateToken, authorizeAdmin, getDoctorsTimeSeries);
router.get('/dashboard/appointments-time-series', authenticateToken, authorizeAdmin, getAppointmentsTimeSeries);

router.get('/total-unread', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const adminId = "689f5be6e5432f608d4b3a54";
    const totalUnread = await Chat.countDocuments({
      receiverId: adminId,
      read: false
    });
    res.json({ totalUnread: totalUnread || 0 });
  } catch (error) {
    console.error('Error:', error);
    res.json({ totalUnread: 0 });
  }
});
// ----------------- ADMIN DYNAMIC ROUTE -----------------
router.get('/:id', authenticateToken, authorizeAdmin, getAdminProfile);


// GET all patients with last message
router.get('/users/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('name email');

    const patientsWithLastMsg = await Promise.all(
      patients.map(async (patient) => {
        const lastChat = await Chat.findOne({
          $or: [
            { senderId: patient._id },
            { receiverId: patient._id }
          ]
        })
        .sort({ createdAt: -1 })
        .select('message createdAt senderId receiverId');

        return {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
          lastMessage: lastChat ? lastChat.message : '',
          lastMessageTime: lastChat ? lastChat.createdAt : null
        };
      })
    );

    res.json(patientsWithLastMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all doctors with last message
router.get('/users/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find().select('_id name email speciality available');

    const doctorsWithLastMsg = await Promise.all(
      doctors.map(async (doctor) => {
        const lastChat = await Chat.findOne({
          $or: [
            { senderId: doctor._id },
            { receiverId: doctor._id }
          ]
        })
        .sort({ createdAt: -1 })
        .select('message createdAt senderId receiverId');

        return {
          _id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          lastMessage: lastChat ? lastChat.message : '',
          lastMessageTime: lastChat ? lastChat.createdAt : null
        };
      })
    );

    res.json(doctorsWithLastMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// 1. Get unread message count
router.get('/api/chats/unread-count', async (req, res) => {
  try {
    const { userId, adminId } = req.query;
    
    const count = await Chat.countDocuments({
      $or: [
        { 
          senderId: userId, 
          receiverId: adminId, 
          read: false,
          senderRole: { $ne: 'admin' } // Only count messages FROM user
        }
      ]
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ count: 0 });
  }
});

// 2. Mark messages as read
router.post('/chats/mark-read', async (req, res) => {
  const { userId, adminId } = req.body;
  
  await Chat.updateMany(
    {
      senderId: userId,
      receiverId: adminId,
      read: false
    },
    { $set: { read: true, readAt: new Date() } }
  );
  
  res.json({ success: true });
});
// Simple endpoint to get admin's total unread messages
// Add this endpoint for admin's total unread messages

module.exports = router;

