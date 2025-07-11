const Doctor = require('../models/doctors');
const Booking = require('../models/booking');
const { User } = require('../models/users');
const mongoose = require('mongoose');
const notifyAll = require('../Utils/notifyAll');
const formatMessage = require('../Utils/formatAppointmentMessage');

// Book Appointment
const bookAppointment = async (req, res) => {
  const { patientId, doctorId, date, time } = req.body;

  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const formattedDate = new Date(date).toISOString().split('T')[0];

    const existingBooking = await Booking.findOne({ doctorId, date: new Date(formattedDate), time });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: "Slot already booked." });
    }

    const patientConflict = await Booking.findOne({ patientId, date: new Date(formattedDate), time });
    if (patientConflict) {
      return res.status(409).json({ success: false, message: "You already have an appointment at this time with another doctor." });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const slotDay = doctor.availabilitySlots.find(slot => slot.date === formattedDate);
    if (!slotDay || !slotDay.slots.includes(time)) {
      return res.status(400).json({ success: false, message: "Slot not available" });
    }

    const newBooking = new Booking({ patientId, doctorId, date: new Date(formattedDate), time });
    await newBooking.save();

    slotDay.slots = slotDay.slots.filter(t => t !== time);
    doctor.availabilitySlots = doctor.availabilitySlots.filter(s => s.slots.length > 0);
    await doctor.save();

    const patient = await User.findById(patientId);
    const admin = await User.findOne({ role: 'admin' });

    const formattedDoctor = {
      _id: doctor._id,
      email: doctor.email,
      name: doctor.name,
      role: doctor.role || 'doctor'
    };

    const message = formatMessage({
      action: 'book',
      appointment: newBooking,
      doctor: formattedDoctor,
      patient
    });

    await notifyAll({ patient, doctor: formattedDoctor, admin, message });

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

// Cancel Appointment
const cancelAppointment = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { canceledBy } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const doctor = await Doctor.findById(booking.doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const bookingDate = booking.date.toISOString().split('T')[0];
    const bookingTime = booking.time;

    const availabilityForDate = doctor.availabilitySlots.find(slot => slot.date === bookingDate);
    if (availabilityForDate) {
      if (!availabilityForDate.slots.includes(bookingTime)) {
        availabilityForDate.slots.push(bookingTime);
      }
    } else {
      doctor.availabilitySlots.push({ date: bookingDate, slots: [bookingTime] });
    }

    await doctor.save();

    const patient = await User.findById(booking.patientId);
    const admin = await User.findOne({ role: 'admin' });

    const formattedDoctor = {
      _id: doctor._id,
      email: doctor.email,
      name: doctor.name,
      role: doctor.role || 'doctor'
    };

    const action = canceledBy === 'doctor' ? 'cancel-doctor' : 'cancel-patient';

    const message = formatMessage({
      action,
      appointment: booking,
      doctor: formattedDoctor,
      patient
    });

    await notifyAll({ patient, doctor: formattedDoctor, admin, message });

    return res.status(200).json({ message: 'Booking cancelled and slot restored' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reschedule Appointment
const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { newDate, newTime, rescheduledBy } = req.body;

  try {
    const updatedAppointment = await Booking.findByIdAndUpdate(
      id,
      { date: newDate, time: newTime, status: 'pending' },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const patient = await User.findById(updatedAppointment.patientId);
    const doctorData = await Doctor.findById(updatedAppointment.doctorId);
    const admin = await User.findOne({ role: 'admin' });

    const formattedDoctor = {
      _id: doctorData._id,
      email: doctorData.email,
      name: doctorData.name,
      role: doctorData.role || 'doctor'
    };

    const action = rescheduledBy === 'doctor' ? 'reschedule-doctor' : 'reschedule-admin';

    const message = formatMessage({
      action,
      appointment: updatedAppointment,
      doctor: formattedDoctor,
      patient
    });

    await notifyAll({ patient, doctor: formattedDoctor, admin, message });

    res.status(200).json({ success: true, message: "Appointment rescheduled successfully", appointment: updatedAppointment });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({ success: false, message: "Failed to reschedule appointment" });
  }
};

// Keep all your other unchanged functions
const getPatientBookings = async (req, res) => {
  const { patientId } = req.params;
  try {
    const bookings = await Booking.find({ patientId })
      .populate('doctorId')
      .populate('patientId', 'name phone');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

const getDoctorAppointments = async (req, res) => {
  const { doctorId } = req.params;
  try {
    const appointments = await Booking.find({ doctorId }).populate('patientId');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.status(200).json({ success: true, appointment: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update appointment" });
  }
};

const getAllAppointmentsForDoctor = async (req, res) => {
  const { doctorId } = req.params;
  try {
    const appointments = await Booking.find({ doctorId }).populate('patientId');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Booking.find().populate('patientId doctorId');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

const getSingleAppointment = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid appointment ID' });
  }

  try {
    const appointment = await Booking.findById(id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialty');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getPatientBookings,
  getDoctorAppointments,
  updateAppointmentStatus,
  getAllAppointmentsForDoctor,
  getAllAppointments,
  getSingleAppointment,
  deleteAppointment
};