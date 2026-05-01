const Doctor = require('../models/doctors');
const Booking = require('../models/booking');
const { User } = require('../models/users');
const mongoose = require('mongoose');
const notifyAll = require('../Utils/notifyAll');
const formatMessage = require('../Utils/formatAppointmentMessage');
const generatePatientNumber = async () => {
  return Math.floor(1000 + Math.random() * 9000);
};


const bookAppointment = async (req, res) => {
const { patientId, doctorId, date, time, name, phone, age, issue } = req.body;

  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  if (isNaN(new Date(date).getTime())) {
    return res.status(400).json({ success: false, message: "Invalid date format." });
  }

  try {
    const patient = await User.findById(patientId);

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
   if (patient.isBlocked) {
      const blockEndDate = patient.blockedUntil ? new Date(patient.blockedUntil).toLocaleDateString() : 'a future date';
      return res.status(403).json({
        success: false,
        message: `Your account is BLOCKED until ${blockEndDate} due to ${patient.missedAppointments} missed appointments. Please contact support.`
      });
    }
    if (patient.isBlocked && patient.blockedUntil && patient.blockedUntil <= new Date()) {
  patient.isBlocked = false;
  patient.missedAppointments = 0;
  patient.blockedUntil = null;
  await patient.save();
}


    if (patient.isBlocked) {
      return res.status(403).json({
        success: false,
        message: `Your account is blocked due to missed appointments. Please wait until ${patient.unblockDate ? patient.unblockDate.toDateString() : 'a future date'
          } to book again.`
      });
    }

    const formattedDate = new Date(date).toISOString().split('T')[0];

const existingBooking = await Booking.findOne({
  doctorId,
  date: new Date(formattedDate),
  time,
  status: { $nin: ['cancelled', 'missed'] }  
});
    if (existingBooking) {
      return res.status(409).json({ success: false, message: "Slot already booked." });
    }

const patientConflict = await Booking.findOne({
  patientId,
  date: new Date(formattedDate),
  time,
  status: { $nin: ['cancelled', 'missed'] }
});
    if (patientConflict) {
      return res.status(409).json({ success: false, message: "You already have an appointment at this time with another doctor." });
    }
const maxDailyAppointments = 5; 
const patientAppointmentsToday = await Booking.countDocuments({
  patientId,
  date: new Date(formattedDate),
  status: { $ne: 'cancelled' } 
});

if (patientAppointmentsToday >= maxDailyAppointments) {
  return res.status(403).json({
    success: false,
    message: `You cannot book more than ${maxDailyAppointments} appointments in a single day.`
  });
}

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const slotDay = doctor.availabilitySlots.find(slot => slot.date === formattedDate);
    const normalizeTime = (t) => t.trim().toUpperCase().replace(/\s+/g, " ");

const normalizedTime = normalizeTime(time);
const hasSlot = slotDay.slots.some(s => normalizeTime(s) === normalizedTime);

if (!slotDay || !hasSlot) {
  return res.status(400).json({ success: false, message: "Slot not available" });
}

    // Generate unique 3-digit token for doctor
const generateToken = async (doctorId, date) => {
  let token;
  let exists = true;

  while (exists) {
    token = Math.floor(100 + Math.random() * 900); 
    exists = await Booking.findOne({ doctorId, date: new Date(date), token });
  }
  return token;
};

const token = await generateToken(doctorId, formattedDate);
const generatePatientNumber = async (patientId, name) => {
  const normalizedName = name.trim().toLowerCase();
  const existingBooking = await Booking.findOne({
    patientId,
    normalizedName, 
  }).sort({ createdAt: 1 });

  if (existingBooking) {
    return existingBooking.patientNumber; 
  }

  const lastBooking = await Booking.findOne({ patientId })
    .sort({ createdAt: -1 });

  let lastNumber = 0;
  if (lastBooking && lastBooking.patientNumber) {
    const parts = lastBooking.patientNumber.split("-");
    lastNumber = parseInt(parts[parts.length - 1], 10) || 0;
  }

  return `${patientId.toString().slice(-4)}-${lastNumber + 1}`;
};

const patientNumber = await generatePatientNumber(patientId, name);
   const appointmentDateTime = new Date(formattedDate);
const [timeStr, ampm] = time.split(" ");
let [hours, minutes] = timeStr.split(":").map(Number);
if (ampm === "PM" && hours !== 12) hours += 12;
if (ampm === "AM" && hours === 12) hours = 0;
appointmentDateTime.setHours(hours, minutes, 0, 0);

const checkInDeadline = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
    const newBooking = new Booking({
      patientId,
      doctorId,
      patientNumber,
      date: new Date(formattedDate),
      time,
      name: req.body.name,
      normalizedName: name.trim().toLowerCase(), 
      phone: req.body.phone,
      email: req.body.email,
      age,
      token,
      issue,
      checkInDeadline: checkInDeadline

    });
 

await newBooking.save();

slotDay.slots = slotDay.slots.filter(s => normalizeTime(s) !== normalizedTime);
// cleaning up empty days
// doctor.availabilitySlots = doctor.availabilitySlots.filter(s => s.slots.length > 0);

await doctor.save();

    const formattedDoctor = {
      _id: doctor._id,
      email: doctor.email,
      name: doctor.name,
      role: doctor.role || 'doctor'
    };

    const patientMessage = formatMessage({
      action: 'book',
      appointment: newBooking.toObject(),
      doctor: formattedDoctor,
      patient: { 
      name: newBooking.name, 
      phone: newBooking.phone,
      age: newBooking.age,
        token: newBooking.token,
      issue: newBooking.issue
  },
      recipient: 'patient'
    });

    const doctorMessage = formatMessage({
      action: 'book',
      appointment: newBooking.toObject(),
      doctor: formattedDoctor,
      patient: { 
      name: newBooking.name, 
      phone: newBooking.phone,
      age: newBooking.age,
        token: newBooking.token,
      issue: newBooking.issue
      },
      recipient: 'doctor'
    });

await notifyAll({
  patient: { ...patient.toObject(), email: newBooking.email },
  message: patientMessage
});

await notifyAll({ doctor: formattedDoctor, message: doctorMessage });
const admin = await User.findOne({ role: 'admin' });

if (admin) {
  const adminMessage = formatMessage({
    action: 'book',
    appointment: newBooking.toObject(),
    doctor: formattedDoctor,
    patient,
     age: newBooking.age,
    recipient: 'admin'
  });

  await notifyAll({ admin, message: adminMessage });
}


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
        token: newBooking.token ,
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
    console.log(" Cancel appointment triggered");

    const bookingId = req.params.id;
    const { canceledBy } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log(" Booking not found");
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      console.log(" Booking already cancelled");
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();
    console.log(" Booking status updated");

    const doctor = await Doctor.findById(booking.doctorId);
    if (!doctor) {
      console.log(" Doctor not found");
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const bookingDate = booking.date.toISOString().split('T')[0];
    const bookingTime = booking.time?.trim();
    console.log(" Booking date:", bookingDate, " time:", bookingTime);

    let slot = doctor.availabilitySlots.find(s => {
      const slotDate = new Date(s.date).toISOString().split('T')[0];
      return slotDate === bookingDate;
    });

    // Parse booking date + time into full Date object
const [time, ampm] = bookingTime.split(" ");
let [hours, minutes] = time.split(":").map(Number);
if (ampm === "PM" && hours !== 12) hours += 12;
if (ampm === "AM" && hours === 12) hours = 0;

const slotDateTime = new Date(booking.date);
slotDateTime.setHours(hours, minutes, 0, 0);

// Check if >= 30 mins remain
const now = new Date();
if ((slotDateTime - now) >= 30 * 60 * 1000) {
  if (slot) {
    if (!slot.slots.includes(bookingTime)) {
      console.log(" Adding time to existing slot");
      slot.slots.push(bookingTime);
    } else {
      console.log("Time already present in slot");
    }
  } else {
    console.log(" Creating new slot for:", bookingDate);
    doctor.availabilitySlots.push({
      date: bookingDate,
      slots: [bookingTime]
    });
  }
} else {
  console.log(" Slot not restored (less than 30 mins remain)");
}


    await doctor.save();
    console.log(" Doctor saved with updated availability:", doctor.availabilitySlots);

    console.log(" Cancel flow reached");
    console.log("Booking data:", booking);

    const patient = await User.findById(booking.patientId);
    console.log("Fetched patient:", patient);

    const doctorData = await Doctor.findById(booking.doctorId);
    console.log("Fetched doctorData:", doctorData);

    const formattedDoctor = {
      _id: doctorData?._id,
      email: doctorData?.email,
      name: doctorData?.name,
      role: doctorData?.role || 'doctor'
    };
    console.log("formattedDoctor debug:", formattedDoctor);


    const action = canceledBy === 'doctor' ? 'cancel-doctor' : 'cancel-patient';

    const patientMessage = formatMessage({
      action,
      appointment: booking,
      doctor: formattedDoctor,
      patient,
      recipient: 'patient'
    });

    const doctorMessage = formatMessage({
      action,
      appointment: booking,
      doctor: formattedDoctor,
      patient,
      recipient: 'doctor'
    });

    await notifyAll({
  patient: { ...patient.toObject(), email: booking.email || patient.email },
  message: patientMessage
});

    await notifyAll({ doctor: formattedDoctor, message: doctorMessage });
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      const adminMessage = formatMessage({
        action,
        appointment: booking,
        doctor: formattedDoctor,
        patient,
        recipient: 'admin'
      });
      await notifyAll({ admin, message: adminMessage });
    }
    
    return res.status(200).json({ message: 'Booking cancelled and slot restored' });

  } catch (err) {
    console.error(' Cancel booking error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
const generateToken = async (doctorId, date) => {
  let token;
  let exists = true;

  while (exists) {
    token = Math.floor(100 + Math.random() * 900); 
    exists = await Booking.findOne({ doctorId, date: new Date(date), token });
  }
  return token;
};

const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { newDate, newTime, rescheduledBy } = req.body;

  if (!['doctor', 'admin'].includes(rescheduledBy)) {
    return res.status(400).json({ success: false, message: "Invalid rescheduler role." });
  }

  try {
    const appointment = await Booking.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    //  Ensure patient still exists
    const patient = await User.findById(appointment.patientId);
    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule. Patient has been removed from the system."
      });
    }
    if (patient.isDeleted) {  
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule. Patient account is deleted."
      });
    }

    // Check for conflicts
    const formattedDate = new Date(newDate).toISOString().split('T')[0];
    const conflict = await Booking.findOne({
      doctorId: appointment.doctorId,
      date: new Date(formattedDate),
      time: newTime,
      _id: { $ne: id }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Doctor already has an appointment at this time."
      });
    }

    // Update appointment details
    const oldDate = appointment.date.toISOString().split('T')[0];
    const newDateFormatted = new Date(newDate).toISOString().split('T')[0]; 
    const existingPatientNumber = appointment.patientNumber;

    appointment.date = newDate;
    appointment.time = newTime;
    appointment.status = 'pending';
    appointment.rescheduledBy = rescheduledBy;

    if (existingPatientNumber) {
      appointment.patientNumber = existingPatientNumber;
    } else {
      appointment.patientNumber = 1; 
    }

    if (oldDate !== newDateFormatted) {
      appointment.token = await generateToken(appointment.doctorId, newDate);
    }

    const updatedAppointment = await appointment.save();

    // Update doctor's availability
    await Doctor.updateOne(
      { _id: appointment.doctorId, "availabilitySlots.date": newDate },
      { $pull: { "availabilitySlots.$.slots": newTime } }
    );

    // Notifications 
    const doctorData = await Doctor.findById(appointment.doctorId);
    const formattedDoctor = {
      _id: doctorData._id,
      email: doctorData.email,
      name: doctorData.name,
      role: doctorData.role || 'doctor'
    };

    const action = rescheduledBy === 'admin' ? 'reschedule-admin' : 'reschedule-doctor';

    const patientMessage = formatMessage({
      action,
      appointment: updatedAppointment,
      doctor: formattedDoctor,
      patient,
      recipient: 'patient'
    });

    const doctorMessage = formatMessage({
      action,
      appointment: updatedAppointment,
      doctor: formattedDoctor,
      patient,
      recipient: 'doctor'
    });

    await notifyAll({ patient: { ...patient.toObject(), email: updatedAppointment.email || patient.email }, message: patientMessage });
    await notifyAll({ doctor: formattedDoctor, message: doctorMessage });

    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      const adminMessage = formatMessage({
        action,
        appointment: updatedAppointment,
        doctor: formattedDoctor,
        patient,
        recipient: 'admin'
      });
      await notifyAll({ admin, message: adminMessage });
    }

    return res.status(200).json({
      success: true,
      message: `Appointment rescheduled successfully by ${rescheduledBy}`,
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({ success: false, message: "Failed to reschedule appointment" });
  }
};

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
  try {
const { status, cancelledBy, feedback } = req.body; 
const id = req.params.id;

const updatedAppointment = await Booking.findByIdAndUpdate(
  id,
  { 
    status, 
    ...(feedback ? { feedback } : {}) 
  },
  { new: true }
);

    if (!updatedAppointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status === 'Cancelled') {
      const patient = await User.findById(updatedAppointment.patientId);
      const doctorData = await Doctor.findById(updatedAppointment.doctorId);

      const formattedDoctor = {
        _id: doctorData._id,
        email: doctorData.email,
        name: doctorData.name,
        role: doctorData.role || 'doctor'
      };

      const action = cancelledBy === 'doctor' ? 'cancel-doctor' : 'cancel-patient';

      const patientMessage = formatMessage({
        action,
        appointment: updatedAppointment,
        doctor: formattedDoctor,
        patient: {
    ...patient.toObject(),
    issue: updatedAppointment.issue || ""
       },
        recipient: 'patient'
      });

      const doctorMessage = formatMessage({
        action,
        appointment: updatedAppointment,
        doctor: formattedDoctor,
        patient: {
    ...patient.toObject(),
    issue: updatedAppointment.issue || ""
},
        recipient: 'doctor'
      });

      console.log(" Sending cancellation notification to patient...");
      await notifyAll({ patient, message: patientMessage });

      console.log(" Sending cancellation notification to doctor...");
      await notifyAll({ doctor: formattedDoctor, message: doctorMessage });

      console.log(" Cancellation notifications sent successfully");
    }

if (status === 'completed' || status === 'Completed') {
  const patient = await User.findById(updatedAppointment.patientId);
  const doctorData = await Doctor.findById(updatedAppointment.doctorId);

  if (patient && doctorData) {
    const formattedDoctor = {
      _id: doctorData._id,
      email: doctorData.email,
      name: doctorData.name,
      role: doctorData.role || 'doctor'
    };

    const action = 'complete';

    const patientMessage = formatMessage({
      action,
      appointment: updatedAppointment,
      doctor: formattedDoctor,
      patient,
      recipient: 'patient'
    });

    const doctorMessage = formatMessage({
      action,
      appointment: updatedAppointment,
      doctor: formattedDoctor,
      patient,
      recipient: 'doctor'
    });

    await notifyAll({
  patient: { ...patient.toObject(), email: updatedAppointment.email || patient.email },
  message: patientMessage
});

    await notifyAll({ doctor: formattedDoctor, message: doctorMessage });
  }
}
    if (status === 'Missed') {
  const patient = await User.findById(updatedAppointment.patientId);

  if (patient) {
    patient.missedAppointments = (patient.missedAppointments || 0) + 1;

    if (patient.missedAppointments === 4) {
      const warningMessage = formatMessage({
        action: 'warning',
        appointment: updatedAppointment,
        doctor: null,
        patient,
        recipient: 'patient'
      });

      console.log(" Sending warning notification to patient...");
      await notifyAll({ patient, message: warningMessage });
await User.updateOne(
  { _id: patient._id },
  { $inc: { missedAppointments: 1 } }
);
    }

    else if (patient.missedAppointments >= 5 && !patient.isBlocked) {
await User.updateOne(
  { _id: patient._id },
  {
    $inc: { missedAppointments: 1 },
    $set: { isBlocked: true, blockedUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
  }
);

      const blockMessage = formatMessage({
        action: 'block',
        appointment: updatedAppointment,
        doctor: null,
        patient,
        recipient: 'patient'
      });

      console.log(" Sending block notification to patient...");
      await notifyAll({ patient, message: blockMessage });
    } else {
await User.updateOne(
  { _id: patient._id },
  { $inc: { missedAppointments: 1 } }
);
    }
  }
}
    res.status(200).json({ success: true, appointment: updatedAppointment });

  } catch (err) {
    console.error(' Error updating appointment status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
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
  deleteAppointment,
};