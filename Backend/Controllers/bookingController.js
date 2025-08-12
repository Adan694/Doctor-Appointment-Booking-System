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

    const newBooking = new Booking({ patientId, doctorId, date: new Date(formattedDate), time, name: req.body.name, 
  phone: req.body.phone  });
    await newBooking.save();

    slotDay.slots = slotDay.slots.filter(t => t !== time);
    doctor.availabilitySlots = doctor.availabilitySlots.filter(s => s.slots.length > 0);
    await doctor.save();

    const patient = await User.findById(patientId);

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

    await notifyAll({ patient, doctor: formattedDoctor, message });

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
    console.log("📍 Cancel appointment triggered");

    const bookingId = req.params.id;
    const { canceledBy } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log("❌ Booking not found");
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      console.log("⚠️ Booking already cancelled");
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();
    console.log("✅ Booking status updated");

    const doctor = await Doctor.findById(booking.doctorId);
    if (!doctor) {
      console.log("❌ Doctor not found");
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const bookingDate = booking.date.toISOString().split('T')[0];
    const bookingTime = booking.time?.trim();
    console.log("📆 Booking date:", bookingDate, "⏰ time:", bookingTime);

    let slot = doctor.availabilitySlots.find(s => {
      const slotDate = new Date(s.date).toISOString().split('T')[0];
      return slotDate === bookingDate;
    });

    if (slot) {
      if (!slot.slots.includes(bookingTime)) {
        console.log("➕ Adding time to existing slot");
        slot.slots.push(bookingTime);
      } else {
        console.log("✅ Time already present in slot");
      }
    } else {
      console.log("🆕 Creating new slot for:", bookingDate);
      doctor.availabilitySlots.push({
        date: bookingDate,
        slots: [bookingTime]
      });
    }

    await doctor.save();
    console.log("💾 Doctor saved with updated availability:", doctor.availabilitySlots);

    const patient = await User.findById(booking.patientId);

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

    await notifyAll({ patient, doctor: formattedDoctor, message });

    return res.status(200).json({ message: 'Booking cancelled and slot restored' });

  } catch (err) {
    console.error('❌ Cancel booking error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Reschedule Appointment
// const rescheduleAppointment = async (req, res) => {
//   const { id } = req.params;
//   const { newDate, newTime, rescheduledBy } = req.body;

//   try {
// const formattedDate = new Date(newDate).toISOString().split('T')[0];

// // Check if the doctor already has a booking at the new date and time
// const currentAppointment = await Booking.findById(id);
// if (!currentAppointment) {
//   return res.status(404).json({ success: false, message: "Appointment not found" });
// }

// const conflict = await Booking.findOne({
//   doctorId: currentAppointment.doctorId,
//   date: new Date(formattedDate),
//   time: newTime,
//   _id: { $ne: id } 
// });

// if (conflict) {
//   return res.status(409).json({ success: false, message: "Doctor already has an appointment at this time." });
// }

// // Proceed to update if no conflict
// const updatedAppointment = await Booking.findByIdAndUpdate(
//   id,
//   { date: newDate, time: newTime, status: 'pending' },
//   { new: true }
//     );
//     // Remove the selected slot from the doctor's availability
// await Doctor.updateOne(
//   { _id: currentAppointment.doctorId, "availabilitySlots.date": newDate },
//   { $pull: { "availabilitySlots.$.slots": newTime } }
// );

//     if (!updatedAppointment) {
//       return res.status(404).json({ success: false, message: "Appointment not found" });
//     }

//     const patient = await User.findById(updatedAppointment.patientId);
//     const doctorData = await Doctor.findById(updatedAppointment.doctorId);
//     const admin = await User.findOne({ role: 'admin' });

//     const formattedDoctor = {
//       _id: doctorData._id,
//       email: doctorData.email,
//       name: doctorData.name,
//       role: doctorData.role || 'doctor'
//     };

//     const action = rescheduledBy === 'doctor' ? 'reschedule-doctor' : 'reschedule-admin';

//     const message = formatMessage({
//       action,
//       appointment: updatedAppointment,
//       doctor: formattedDoctor,
//       patient
//     });

//     await notifyAll({ patient, doctor: formattedDoctor, admin, message });

//     res.status(200).json({ success: true, message: "Appointment rescheduled successfully", appointment: updatedAppointment });
//   } catch (error) {
//     console.error("Error rescheduling appointment:", error);
//     res.status(500).json({ success: false, message: "Failed to reschedule appointment" });
//   }
// };
// Reschedule Appointment
const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { newDate, newTime, rescheduledBy } = req.body;

  // Prevent admin from rescheduling
  if (rescheduledBy === 'admin') {
    return res.status(403).json({ success: false, message: "Only doctors can reschedule appointments." });
  }

  try {
    const formattedDate = new Date(newDate).toISOString().split('T')[0];

    // Check if the doctor already has a booking at the new date and time
    const currentAppointment = await Booking.findById(id);
    if (!currentAppointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const conflict = await Booking.findOne({
      doctorId: currentAppointment.doctorId,
      date: new Date(formattedDate),
      time: newTime,
      _id: { $ne: id }
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: "Doctor already has an appointment at this time." });
    }

    // Proceed to update if no conflict
    const updatedAppointment = await Booking.findByIdAndUpdate(
      id,
      { date: newDate, time: newTime, status: 'pending' },
      { new: true }
    );

    // Remove the selected slot from the doctor's availability
    await Doctor.updateOne(
      { _id: currentAppointment.doctorId, "availabilitySlots.date": newDate },
      { $pull: { "availabilitySlots.$.slots": newTime } }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const patient = await User.findById(updatedAppointment.patientId);
    const doctorData = await Doctor.findById(updatedAppointment.doctorId);

    const formattedDoctor = {
      _id: doctorData._id,
      email: doctorData.email,
      name: doctorData.name,
      role: doctorData.role || 'doctor'
    };

    const action = 'reschedule-doctor'; // Only doctors can now reschedule

    const message = formatMessage({
      action,
      appointment: updatedAppointment,
      doctor: formattedDoctor,
      patient
    });

    // Notify only patient and doctor (no admin)
    await notifyAll({ patient, doctor: formattedDoctor, message });

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: updatedAppointment
    });

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