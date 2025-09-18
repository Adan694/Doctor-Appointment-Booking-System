const express = require('express');
const { deactivatePatient, activatePatient, getAdminProfile,getPatientById,getAppointmentsByPatientId, getAllPatients, deletePatient, getTotalUsers, getTodaysAppointments, getFeedbackAlerts, getLatestBookings, getCurrentAdminProfile, getUserCounts,getTotalAppointmentsCount, getPatientsTimeSeries, getDoctorsTimeSeries, getAppointmentsTimeSeries  } = require('../Controllers/AdminController');
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');
const router = express.Router();

router.get('/profile', authenticateToken, authorizeAdmin, getCurrentAdminProfile);
router.get('/patients', authenticateToken, authorizeAdmin, getAllPatients);
router.delete('/patients/:id', authenticateToken, authorizeAdmin, deletePatient);
router.get('/:id', authenticateToken, authorizeAdmin, getAdminProfile);
router.get('/dashboard/total-users', authenticateToken, authorizeAdmin, getTotalUsers);
router.get('/dashboard/user-counts', authenticateToken, authorizeAdmin, getUserCounts);
router.get('/dashboard/todays-appointments', authenticateToken, authorizeAdmin, getTodaysAppointments);
router.get('/dashboard/feedback-alerts', authenticateToken, authorizeAdmin, getFeedbackAlerts);
router.get('/dashboard/latest-bookings', authenticateToken, authorizeAdmin, getLatestBookings);
router.get('/dashboard/total-appointments', authenticateToken, authorizeAdmin, getTotalAppointmentsCount);
router.get('/dashboard/patients-time-series', authenticateToken, authorizeAdmin, getPatientsTimeSeries);
router.get('/dashboard/doctors-time-series', authenticateToken, authorizeAdmin, getDoctorsTimeSeries);
router.get('/dashboard/appointments-time-series', authenticateToken, authorizeAdmin, getAppointmentsTimeSeries);
router.get('/patients/:id', getPatientById);
router.get('/patients/:id/appointments', getAppointmentsByPatientId);
router.patch("/patients/:id/deactivate", authenticateToken, authorizeAdmin, deactivatePatient);
router.patch("/patients/:id/activate", authenticateToken, authorizeAdmin, activatePatient);


module.exports = router;
