const Doctor = require('../models/doctors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Feedback = require('../models/feedback');
const Booking = require('../models/booking'); 

const addDoctor = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { name, email, password, speciality, degree, address1, address2, experience, fees, about } = req.body;
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

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const today = new Date().toISOString().split('T')[0];
    // Filter only future availability slots
    doctor.availabilitySlots = doctor.availabilitySlots.filter(slot => {
      return new Date(slot.date).toISOString().split('T')[0] >= today;
    });

    const bookings = await Booking.find({ doctorId: doctor._id });

    // Normalize date format for comparison
    const formatDate = (d) => new Date(d).toISOString().split('T')[0];

    // Filter available slots based on existing (non-cancelled) bookings
    const filteredAvailability = doctor.availabilitySlots
      .map(slot => {
        const availableTimes = slot.slots.filter(time => {
          const isBooked = bookings.some(booking =>
            formatDate(booking.date) === formatDate(slot.date) &&
            booking.time?.trim() === time.trim()
          );
          return !isBooked;
        });

        return {
          date: slot.date,
          slots: availableTimes
        };
      })
      .filter(slot => slot.slots.length > 0);

    // Fetch feedback for this doctor
    const feedback = await Feedback.find({ doctorId: doctor._id });

    // Respond with updated doctor object
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

    newSlots.forEach(newSlot => {
      const newSlotDate = new Date(newSlot.date).toISOString().split('T')[0];

      const existingIndex = existingSlots.findIndex(slot => {
        const existingSlotDate = new Date(slot.date).toISOString().split('T')[0];
        return existingSlotDate === newSlotDate;
      });

      if (existingIndex >= 0) {
        // Merge and remove duplicates
        existingSlots[existingIndex].slots = Array.from(new Set([
          ...existingSlots[existingIndex].slots,
          ...newSlot.slots.map(s => s.trim())
        ]));
      } else {
        // Normalize new slot date
        existingSlots.push({
          date: newSlotDate,
          slots: newSlot.slots.map(s => s.trim())
        });
      }
    });

    doctor.availabilitySlots = existingSlots;
    doctor.markModified('availabilitySlots'); // Ensure Mongoose detects change

    console.log("✅ Saving availabilitySlots:", doctor.availabilitySlots);

    await doctor.save();

    res.status(200).json({ availabilitySlots: doctor.availabilitySlots });
  } catch (error) {
    console.error("❌ Error updating availability:", error);
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
    const slotDate = req.params.date; // e.g., "2025-08-07"

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Normalize dates to ensure proper comparison
    doctor.availabilitySlots = doctor.availabilitySlots.filter(slot => {
      const slotDateOnly = new Date(slot.date).toISOString().split('T')[0];
      return slotDateOnly !== slotDate;
    });

    await doctor.save();

    res.status(200).json({
      message: "Availability slot deleted",
      availabilitySlots: doctor.availabilitySlots
    });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ message: "Failed to delete availability slot" });
  }
};

const updateAvailabilityOrder = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const newOrder = req.body.order; 

    if (!Array.isArray(newOrder)) {
      return res.status(400).json({ message: "Invalid order format" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Create a map from date to slot object for quick lookup
    const slotsMap = {};
    doctor.availabilitySlots.forEach(slot => {
      slotsMap[slot.date] = slot;
    });

    // Reorder availabilitySlots according to newOrder array
    const reorderedSlots = [];
    newOrder.forEach(date => {
      if (slotsMap[date]) {
        reorderedSlots.push(slotsMap[date]);
      }
    });

    // Optional: If there are any slots not included in newOrder, append them at the end
    doctor.availabilitySlots.forEach(slot => {
      if (!newOrder.includes(slot.date)) {
        reorderedSlots.push(slot);
      }
    });

    doctor.availabilitySlots = reorderedSlots;
    await doctor.save();

    res.status(200).json({ message: "Availability order updated successfully" });
  } catch (error) {
    console.error("Error updating availability order:", error);
    res.status(500).json({ message: "Failed to update availability order" });
  }
};


module.exports = { addDoctor, getDoctors, updateDoctor, deleteDoctor, getDoctorById, updateDoctorAvailability, getDoctorAvailability, deleteDoctorAvailabilitySlot,updateAvailabilityOrder,};
