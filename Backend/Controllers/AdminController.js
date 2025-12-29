const bcrypt = require('bcrypt');
const { User } = require('../models/users');
const Feedback = require('../models/feedback');
const Booking = require('../models/booking');
const Doctor = require('../models/doctors');
const mongoose = require('mongoose');
const notifyAll = require('../Utils/notifyAll');
const Notification = require('../models/Notification');

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
    const adminId = req.user.id; 
    const admin = await User.findOne({ _id: adminId, role: 'admin' }).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
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

const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await User.findOne({ _id: patientId, role: 'patient' });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find all bookings of this patient
    const bookings = await Booking.find({ patientId });

    // Cancel all bookings
    await Booking.updateMany({ patientId }, { status: 'Cancelled' });

    // Notify doctors about cancelled bookings
    for (const booking of bookings) {
      const doctor = await Doctor.findById(booking.doctorId);
      if (doctor) {
        const message = `Appointment with patient ${patient.name} on ${new Date(booking.date).toLocaleDateString()} at ${booking.time} has been cancelled.`;

        await Notification.create({
          userId: doctor._id,
          message
        });

        await notifyAll({
          patient: null,
          doctor,
          admin: null,
          message
        });
      }
    }

    // Notify the patient that their account is deleted
    const patientMessage = `Your account has been removed from the system, and all your appointments have been cancelled.`;
    await Notification.create({
      userId: patient._id,
      message: patientMessage
    });

    await notifyAll({
      patient,
      doctor: null,
      admin: null,
      message: patientMessage
    });

    // Delete the patient
    await User.deleteOne({ _id: patientId });

    res.json({ message: 'Patient deleted, appointments cancelled, and notifications sent to doctors and patient.' });
  } catch (error) {
    console.error(error);
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
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const appointments = await Booking.find({
  date: { $gte: startOfDay, $lte: endOfDay },
})
.populate('patientId doctorId', 'name photo') 
.lean();

const formattedAppointments = appointments.map(app => ({
  patientName: app.name || app.patientId?.name || 'Unknown',
  doctorName: app.doctorId?.name || 'Unknown',
  time: app.time || 'N/A',
  status: app.status || 'Unknown'
}));

res.json({ todaysAppointments: formattedAppointments });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get feedback alerts count
const getFeedbackAlerts = async (req, res) => {
  try {
    const count = await Feedback.countDocuments();
    res.json({ feedbackAlerts: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getLatestBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('doctorId', 'name')
      .populate('patientId', 'name');

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

const getTotalAppointmentsCount = async (req, res) => {
  try {
    const count = await Booking.countDocuments();
    res.json({ totalAppointments: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getPatientsTimeSeries = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    const data = await User.aggregate([
      {
        $match: {
          role: 'patient',
          createdAt: { $gte: sevenDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    console.log('Patients Data:', data);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getDoctorsTimeSeries = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const doctorsData = await Doctor.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
console.log('Doctors Data:', doctorsData);

    res.json(doctorsData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getAppointmentsTimeSeries = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const appointmentsData = await Booking.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(appointmentsData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
// Get a single patient's details by ID
const getPatientById = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await User.findOne({ _id: patientId, role: 'patient' }).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all appointments for a specific patient
const getAppointmentsByPatientId = async (req, res) => {
  try {
    const patientId = req.params.id;
    const appointments = await Booking.find({ patientId })
      .populate('doctorId', 'name')
      .lean();

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
// Deactivate patient
const deactivatePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await User.findOneAndUpdate(
      { _id: patientId, role: 'patient' },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ message: 'Patient account deactivated successfully', patient });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Activate patient
const activatePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await User.findOneAndUpdate(
      { _id: patientId, role: 'patient' },
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ message: 'Patient account activated successfully', patient });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { email: tokenEmail } = req.user; // get email from token
    const { name, email, phone } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Find the admin in DB using the email from token
    const admin = await User.findOne({ email: tokenEmail, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Check if email is used by another user
    const existingUser = await User.findOne({ email, _id: { $ne: admin._id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Update admin
    admin.name = name;
    admin.email = email;
    admin.phone = phone;
    await admin.save();

    res.json({ message: 'Profile updated successfully', admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update admin password
const updateAdminPassword = async (req, res) => {
  try {
    console.log('Inside updateAdminPassword, req.user:', req.user);
    const adminId = req.user.id; 
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: 'Old and new passwords are required' });

const admin = await User.findOne({ email: req.user.email, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};


module.exports = {
  getAdminProfile,
  getCurrentAdminProfile,
  getAllPatients,
  getPatientById,
  getAppointmentsByPatientId,
  deletePatient,
  getTotalUsers,
  getTodaysAppointments,
  getFeedbackAlerts,
  getLatestBookings,
  getUserCounts,
  getTotalAppointmentsCount,
  getPatientsTimeSeries,
  getDoctorsTimeSeries,
  getAppointmentsTimeSeries,
  deactivatePatient,
  activatePatient,
    updateAdminProfile,
  updateAdminPassword
};


