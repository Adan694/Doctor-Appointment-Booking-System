const Booking = require('../models/booking');

// Book an appointment
const bookAppointment = async (req, res) => {
    const { patientId, doctorId, date, time } = req.body;


    console.log("Booking Request Data:", { patientId, doctorId, date, time }); // Log incoming data
   

    if (!patientId || !doctorId || !date || !time) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        const newBooking = new Booking({ patientId, doctorId, date, time });
        await newBooking.save();
        
        res.status(201).json({ success: true, message: "Appointment booked successfully", booking: newBooking });
    } catch (error) {
        console.error("Error booking appointment:", error);
        res.status(500).json({ success: false, message: "Failed to book appointment" });
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
module.exports = { bookAppointment, getPatientBookings, getDoctorAppointments, cancelAppointment };