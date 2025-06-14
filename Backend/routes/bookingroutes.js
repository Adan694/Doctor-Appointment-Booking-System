const express = require('express');
const { bookAppointment, getPatientBookings, getDoctorAppointments, cancelAppointment, updateAppointmentStatus,
  getAllAppointmentsForDoctor, getAllAppointments, rescheduleAppointment } = require('../Controllers/bookingController');
const router = express.Router();

console.log('Booking routes initialized'); // Verify this shows in console
router.get('/test', (req, res) => {
    console.log('Test route hit!'); // Check server logs for this
    res.json({ message: 'Booking routes working!' });
  });
  
// Route for booking an appointment
router.post('/', bookAppointment);
router.delete('/:id', cancelAppointment);

// router.get('/appointments/patient/:patientId', getPatientBookings);

// router.get('/appointments/doctor/:doctorId', getDoctorAppointments);
// Route for fetching patient bookings
router.get('/patient/:patientId', getPatientBookings);

// Route for fetching doctor appointments
router.get('/doctor/:doctorId', getDoctorAppointments);

// Route to update the status of an appointment
// router.put('/appointments/:id/status', updateAppointmentStatus);
// router.put('/appointments/:id', updateAppointmentStatus); // Add this line
router.put('/:id/status', updateAppointmentStatus);


// Route to get all appointments for a specific doctor
router.get('/appointments/doctor/all/:doctorId', getAllAppointmentsForDoctor);

// Route to get all appointments
router.get('/appointments/all', getAllAppointments);

// Route to reschedule an appointment
router.put('/appointments/:id/reschedule', rescheduleAppointment);



module.exports = router;