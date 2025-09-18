const express = require('express');
const { bookAppointment, getPatientBookings, getDoctorAppointments, cancelAppointment, updateAppointmentStatus,
  getAllAppointmentsForDoctor, getAllAppointments, rescheduleAppointment, getSingleAppointment, deleteAppointment } = require('../Controllers/bookingController');
const router = express.Router();

console.log('Booking routes initialized'); 
router.get('/test', (req, res) => {
    console.log('Test route hit!'); 
    res.json({ message: 'Booking routes working!' });
  });
  
router.post('/', bookAppointment);
router.put('/:id/cancel', cancelAppointment);
router.get('/patient/:patientId', getPatientBookings);
router.get('/doctor/:doctorId', getDoctorAppointments);
router.put('/:id/status', updateAppointmentStatus);
router.get('/appointments/doctor/all/:doctorId', getAllAppointmentsForDoctor);
router.get('/all', getAllAppointments);
router.put('/:id/reschedule', rescheduleAppointment);
router.get('/:id', getSingleAppointment);
router.delete('/:id', deleteAppointment);


module.exports = router;