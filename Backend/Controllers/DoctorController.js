const Doctor = require('../models/doctors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Feedback = require('../models/feedback');
const Booking = require('../models/booking'); // make sure this is imported

const addDoctor = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { name, email, password, speciality, degree, address1, address2, experience, fees, about } = req.body;

    // Validate required fields
    if (!name || !email || !password || !speciality || !degree || !address1 || !experience || !fees || !about) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = new Doctor({
      name,
      email,
      password: hashedPassword,
      speciality,
      degree,
      address1,
      address2,
      experience,
      fees,
      about,
      photo: req.file?.filename || null,
      available: req.body.available === 'true',
      role: req.body.role || 'doctor' 
    });

    await newDoctor.save();

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      doctor: newDoctor
    });

  } catch (err) {
    console.error("Error adding doctor:", err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get all doctors
const getDoctors = async (req, res) => {
  try {
      const doctors = await Doctor.find();
      res.status(200).json(doctors);
  } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a doctor by ID
// const getDoctorById = async (req, res) => {
//   try {
//       const doctor = await Doctor.findById(req.params.id);
//       if (!doctor) {
//           return res.status(404).json({ message: 'Doctor not found.' });
//       }
// // Clean out past availability slots before sending
// const today = new Date().toISOString().split('T')[0];
// doctor.availabilitySlots = doctor.availabilitySlots.filter(slot => slot.date >= today);

//    //  Fetch feedback for this doctor
//    const feedback = await Feedback.find({ doctorId: doctor._id });

//    res.status(200).json({
//      ...doctor.toObject(),
//      feedback: feedback.length ? feedback : [],
//    });
    

//   } catch (error) {
//       console.error('Error fetching doctor:', error);
//       res.status(500).json({ message: 'Internal server error.' });
//   }
// };

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const today = new Date().toISOString().split('T')[0];
    doctor.availabilitySlots = doctor.availabilitySlots.filter(slot => slot.date >= today);

    // Get all bookings for this doctor
    const bookings = await Booking.find({
      doctorId: doctor._id,
      status: { $nin: ['Cancelled', 'missed'] } // only consider active bookings
    });

    // Build a map of booked slots per date for faster lookup
    const bookedSlotsMap = new Map();
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.date).toISOString().split('T')[0];
      if (!bookedSlotsMap.has(bookingDate)) {
        bookedSlotsMap.set(bookingDate, new Set());
      }
      bookedSlotsMap.get(bookingDate).add(booking.time);
    });

    // Filter out past slots and already booked slots
    const filteredAvailability = doctor.availabilitySlots.filter(slot => {
  return slot.date >= today;
}).map(slot => {
  const availableTimes = slot.slots.filter(time => {
    const isBooked = bookings.some(booking =>
      new Date(booking.date).toISOString().split('T')[0] === slot.date &&
      booking.time === time
    );
    return !isBooked; // only keep unbooked (or cancelled) times
  });

  return {
    date: slot.date,
    slots: availableTimes
  };
}).filter(slot => slot.slots.length > 0);


    // Fetch feedback for this doctor
    const feedback = await Feedback.find({ doctorId: doctor._id });

    res.status(200).json({
      ...doctor.toObject(),
      availabilitySlots: filteredAvailability,
      feedback: feedback.length ? feedback : [],
    });

  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update a doctor by ID
const updateDoctor = async (req, res) => {
  try {
    const updateFields = req.body;
    delete updateFields.password;
    delete updateFields.email;
if (req.file) {
  updateFields.photo = req.file.filename;  
}
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    res.status(200).json({ message: 'Profile updated successfully.', doctor: updatedDoctor });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// Delete a doctor by ID
const deleteDoctor = async (req, res) => {
  try {
      const doctor = await Doctor.findByIdAndDelete(req.params.id);
      if (!doctor) {
          return res.status(404).json({ message: 'Doctor not found.' });
      }
      res.status(200).json({ message: 'Doctor deleted successfully.' });
  } catch (error) {
      console.error('Error deleting doctor:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};

const updateDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { availabilitySlots: newSlots } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const existingSlots = doctor.availabilitySlots || [];

    // Merge logic
    newSlots.forEach(newSlot => {
      const existingIndex = existingSlots.findIndex(slot => slot.date === newSlot.date);
      if (existingIndex >= 0) {
        existingSlots[existingIndex].slots = Array.from(new Set([
          ...existingSlots[existingIndex].slots,
          ...newSlot.slots
        ]));
      } else {
        existingSlots.push(newSlot);
      }
    });

    doctor.availabilitySlots = existingSlots;
    console.log("Saving availabilitySlots:", doctor.availabilitySlots);

    await doctor.save();

    res.status(200).json({ availabilitySlots: doctor.availabilitySlots });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ message: "Failed to update availability" });
  }
};

const getDoctorAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' }); 
    }
    
    const today = new Date().toISOString().split('T')[0]; 
    const futureSlots = doctor.availabilitySlots.filter(slot => slot.date >= today);
    
    res.json({ availabilitySlots: futureSlots });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' }); 
  }
};

const deleteDoctorAvailabilitySlot = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const slotDate = req.params.date;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    doctor.availabilitySlots = doctor.availabilitySlots.filter(slot => slot.date !== slotDate);
    await doctor.save();

    res.status(200).json({ message: "Availability slot deleted", availabilitySlots: doctor.availabilitySlots });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ message: "Failed to delete availability slot" });
  }
};

module.exports = { addDoctor, getDoctors, updateDoctor, deleteDoctor, getDoctorById, updateDoctorAvailability, getDoctorAvailability, deleteDoctorAvailabilitySlot};
