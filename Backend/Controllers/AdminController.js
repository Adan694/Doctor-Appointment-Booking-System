const bcrypt = require('bcrypt');

const { User } = require('../models/users');
const Feedback = require('../models/feedback');
const Booking = require('../models/booking');
const Doctor = require('../models/doctors');

// Get admin profile by ID
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.params.id;
    const admin = await User.findOne({ _id: adminId, role: 'admin' }).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get current admin profile from token
const getCurrentAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id; // Assuming req.user is set by auth middleware
    const admin = await User.findOne({ _id: adminId, role: 'admin' }).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update admin profile by ID
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { name, email, phone } = req.body;

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.phone = phone || admin.phone;

    await admin.save();
    res.json({ message: 'Admin profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Change admin password
const changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { oldPassword, newPassword } = req.body;

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    await admin.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all patients
const getAllPatients = async (req, res) => {
  try {
    console.log('getAllPatients called');
    const patients = await User.find({ role: 'patient' }).select('-password');
    console.log('Patients found:', patients.length);
    if (!patients || patients.length === 0) {
      console.warn('No patients found in the database.');
    }
    res.json(patients);
  } catch (error) {
    console.error('Error in getAllPatients:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a patient by ID
const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    await User.deleteOne({ _id: patientId });
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get total users count
const getTotalUsers = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: { $in: ['admin', 'doctor', 'patient'] } });
    res.json({ totalUsers: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get counts of patients and doctors separately
const getUserCounts = async (req, res) => {
  try {
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await Doctor.countDocuments();
    res.json({ patientCount, doctorCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get today's appointments count
const getTodaysAppointments = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Booking.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    });
    res.json({ todaysAppointments: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get feedback alerts count
const getFeedbackAlerts = async (req, res) => {
  try {
    // For simplicity, count all feedbacks as alerts
    const count = await Feedback.countDocuments();
    res.json({ feedbackAlerts: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getLatestBookings = async (req, res) => {
  try {
    // Fetch latest 5 bookings sorted by date descending
    const bookings = await Booking.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('doctorId', 'name')
      .populate('patientId', 'name');

    // Map bookings to desired format
    const formattedBookings = bookings.map(b => ({
      doctorName: b.doctorId ? b.doctorId.name : 'Unknown Doctor',
      patientName: b.patientId ? b.patientId.name : 'Unknown Patient',
      date: b.date.toDateString(),
      status: b.status
    }));

    res.json(formattedBookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  getAdminProfile,
  getCurrentAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getAllPatients,
  deletePatient,
  getTotalUsers,
  getUserCounts,
  getTodaysAppointments,
  getFeedbackAlerts,
  getLatestBookings,
};
