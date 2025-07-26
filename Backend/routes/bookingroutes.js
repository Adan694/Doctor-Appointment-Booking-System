const express = require('express');
const { bookAppointment, getPatientBookings, getDoctorAppointments, cancelAppointment, updateAppointmentStatus,
  getAllAppointmentsForDoctor, getAllAppointments, rescheduleAppointment, getSingleAppointment, deleteAppointment } = require('../Controllers/bookingController');
const router = express.Router();

console.log('Booking routes initialized'); // Verify this shows in console
router.get('/test', (req, res) => {
    console.log('Test route hit!'); // Check server logs for this
    res.json({ message: 'Booking routes working!' });
  });
  
// Route for booking an appointment
router.post('/', bookAppointment);
router.put('/:id', cancelAppointment);

// Route for fetching patient bookings
router.get('/patient/:patientId', getPatientBookings);

// Route for fetching doctor appointments
router.get('/doctor/:doctorId', getDoctorAppointments);

// Route to update the status of an appointment
router.put('/:id/status', updateAppointmentStatus);

// Route to get all appointments for a specific doctor
router.get('/appointments/doctor/all/:doctorId', getAllAppointmentsForDoctor);
router.get('/all', getAllAppointments);

// Route to reschedule an appointment
router.put('/:id/reschedule', rescheduleAppointment);
router.get('/:id', getSingleAppointment);
router.delete('/:id', deleteAppointment);


module.exports = router;