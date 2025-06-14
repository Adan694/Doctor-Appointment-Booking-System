// const Booking = require('../models/booking');
// const { User } = require('../models/users'); 

// const bookAppointment = async (req, res) => {
//     const { patientId, doctorId, date, time } = req.body;

//     console.log("Booking Request Data:", { patientId, doctorId, date, time }); // Log incoming data

//     if (!patientId || !doctorId || !date || !time) {
//         return res.status(400).json({ success: false, message: "All fields are required." });
//     }

//     try {
//         const existingBooking = await Booking.findOne({ doctorId, date, time });
//         if (existingBooking) {
//             return res.status(409).json({ success: false, message: "Appointment already booked for this time." });
//         }

//         const newBooking = new Booking({ patientId, doctorId, date, time });
//         await newBooking.save();

//         // Fetch the patient's name for display
//         // const patient = await Patient.findById(patientId);
//         const patient = await User.findById(patientId);
//         const patientName = patient ? patient.name : 'Unknown Patient'; // Fallback if patient not found

//         // Send the response with booking information
//         res.status(201).json({
//             success: true,
//             message: "Appointment booked successfully",
//             booking: {
//                 _id: newBooking._id,
//                 patientId: patientId,
//                 doctorId: doctorId,
//                 date: date,
//                 time: time,
//                 patientName: patientName // Include the patient's name in the response
//             }
//         });
//     } catch (error) {
//         console.error("Error booking appointment:", error);
//         res.status(500).json({ success: false, message: "Failed to book appointment", error: error.message });
//     }
// };

const Doctor = require('../models/doctors');
const Booking = require('../models/booking');
const { User } = require('../models/users');

const bookAppointment = async (req, res) => {
  const { patientId, doctorId, date, time } = req.body;

  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    // Format date string
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // Prevent duplicate booking
    const existingBooking = await Booking.findOne({ doctorId, date: new Date(formattedDate), time });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: "Slot already booked." });
      }
      // 🚫 Prevent patient double-booking with other doctors
    const patientConflict = await Booking.findOne({ patientId, date: new Date(formattedDate), time });
    if (patientConflict) {
      return res.status(409).json({
      success: false,
    message: "You already have an appointment at this time with another doctor.",
     });
         }

    // Find doctor and check slot availability
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const slotDay = doctor.availabilitySlots.find(slot => slot.date === formattedDate);
    if (!slotDay || !slotDay.slots.includes(time)) {
      return res.status(400).json({ success: false, message: "Slot not available" });
    }

    // Save booking
    const newBooking = new Booking({ patientId, doctorId, date: new Date(formattedDate), time });
    await newBooking.save();

    // Remove booked time from doctor's slot
    slotDay.slots = slotDay.slots.filter(t => t !== time);
    doctor.availabilitySlots = doctor.availabilitySlots.filter(s => s.slots.length > 0); // clean empty days
    await doctor.save();

    // Get patient name
    const patient = await User.findById(patientId);
    const patientName = patient ? patient.name : 'Unknown';

    res.status(201).json({
      success: true,
      message: "Appointment booked",
      booking: {
        _id: newBooking._id,
        patientId,
        doctorId,
        date,
        time,
        patientName
      }
    });

  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify appointment exists and belongs to requesting user
        const appointment = await Booking.findById(id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }

        // Delete from database
        await Booking.findByIdAndDelete(id);
        
        res.status(200).json({ 
            success: true, 
            message: "Appointment cancelled successfully" 
        });
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to cancel appointment" 
        });
    }
};

// Get bookings for a specific patient
const getPatientBookings = async (req, res) => {
    const { patientId } = req.params;
    console.log("Fetching bookings for patientId:", patientId); // 👈 Add this

    try {
        const bookings = await Booking.find({ patientId }).populate('doctorId');
        console.log("Found bookings:", bookings); // 👈 Optional debug

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};

// Endpoint to get doctor's appointments
const getDoctorAppointments = async (req, res) => {
    const { doctorId } = req.params; // Assume doctorId is passed as a URL parameter
    try {
        const appointments = await Booking.find({ doctorId }).populate('patientId');
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ message: "Failed to fetch appointments" });
    }
};

const updateAppointmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expecting { status: 'Completed' }

    try {
        const updatedAppointment = await Booking.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedAppointment) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }
        res.status(200).json({ success: true, message: "Appointment updated successfully", appointment: updatedAppointment });
    } catch (error) {
        console.error("Error updating appointment:", error);
        res.status(500).json({ success: false, message: "Failed to update appointment" });
    }
};

const getAllAppointmentsForDoctor = async (req, res) => {
    const { doctorId } = req.params;

    try {
        const appointments = await Booking.find({ doctorId }).populate('patientId'); // Populate patient details
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching all appointments for doctor:", error);
        res.status(500).json({ message: "Failed to fetch appointments" });
    }
};

const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Booking.find().populate('patientId doctorId'); // Populate both patient and doctor details
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching all appointments:", error);
        res.status(500).json({ message: "Failed to fetch appointments" });
    }
};
const rescheduleAppointment = async (req, res) => {
    const { id } = req.params;
    const { newDate, newTime } = req.body; // Expecting { newDate: 'YYYY-MM-DD', newTime: 'HH:MM' }

    try {
        const updatedAppointment = await Booking.findByIdAndUpdate(id, { date: newDate, time: newTime }, { new: true });
        if (!updatedAppointment) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }
        res.status(200).json({ success: true, message: "Appointment rescheduled successfully", appointment: updatedAppointment });
    } catch (error) {
        console.error("Error rescheduling appointment:", error);
        res.status(500).json({ success: false, message: "Failed to reschedule appointment" });
    }
};

module.exports = { bookAppointment, getPatientBookings, getDoctorAppointments, cancelAppointment, updateAppointmentStatus, getAllAppointmentsForDoctor, getAllAppointments, rescheduleAppointment};