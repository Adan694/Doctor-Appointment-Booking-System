const express = require('express');
const { getAdminProfile, updateAdminProfile, changeAdminPassword, getAllPatients, deletePatient, getTotalUsers, getTodaysAppointments, getFeedbackAlerts, getLatestBookings, getCurrentAdminProfile, getUserCounts,getTotalAppointmentsCount, getTodaysAppointmentsList, getPatientsTimeSeries, getDoctorsTimeSeries, getAppointmentsTimeSeries  } = require('../Controllers/AdminController');
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');
const router = express.Router();

// Get current admin profile
router.get('/profile', authenticateToken, authorizeAdmin, getCurrentAdminProfile);

// Get all patients
router.get('/patients', authenticateToken, authorizeAdmin, getAllPatients);
// Delete a patient by ID
router.delete('/patients/:id', authenticateToken, authorizeAdmin, deletePatient);

// Get admin profile
router.get('/:id', authenticateToken, authorizeAdmin, getAdminProfile);

// Update admin profile
router.put('/:id', authenticateToken, authorizeAdmin, updateAdminProfile);

// Change admin password
router.put('/:id/change-password', authenticateToken, authorizeAdmin, changeAdminPassword);

// Dashboard stats routes
router.get('/dashboard/total-users', authenticateToken, authorizeAdmin, getTotalUsers);
router.get('/dashboard/user-counts', authenticateToken, authorizeAdmin, getUserCounts);
router.get('/dashboard/todays-appointments', authenticateToken, authorizeAdmin, getTodaysAppointments);
router.get('/dashboard/feedback-alerts', authenticateToken, authorizeAdmin, getFeedbackAlerts);
router.get('/dashboard/latest-bookings', authenticateToken, authorizeAdmin, getLatestBookings);
router.get('/dashboard/total-appointments', authenticateToken, authorizeAdmin, getTotalAppointmentsCount);
router.get('/dashboard/todays-appointments-list', authenticateToken, authorizeAdmin, getTodaysAppointmentsList);

// New routes for time series data
router.get('/dashboard/patients-time-series', authenticateToken, authorizeAdmin, getPatientsTimeSeries);
router.get('/dashboard/doctors-time-series', authenticateToken, authorizeAdmin, getDoctorsTimeSeries);
router.get('/dashboard/appointments-time-series', authenticateToken, authorizeAdmin, getAppointmentsTimeSeries);

module.exports = router;
