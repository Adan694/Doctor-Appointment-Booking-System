const Doctor = require('../models/doctors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const addDoctor = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Doctor photo is required' });
    }

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
      photo: req.file.filename,
      available: req.body.available === 'true',
      role: req.body.role || 'doctor' // Store the role from the request
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
const getDoctorById = async (req, res) => {
  try {
      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
          return res.status(404).json({ message: 'Doctor not found.' });
      }
      // res.status(200).json(doctor);
// Clean out past availability slots before sending
const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
doctor.availabilitySlots = doctor.availabilitySlots.filter(slot => slot.date >= today);

res.status(200).json(doctor);

  } catch (error) {
      console.error('Error fetching doctor:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};
// const getDoctorById = async (req, res) => {
//   const { id } = req.params;

//   // Validate if ID is present and a valid MongoDB ObjectId
//   if (!id || id === 'null' || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ message: 'Invalid doctor ID' });
//   }

//   try {
//     const doctor = await Doctor.findById(id);
//     if (!doctor) {
//       return res.status(404).json({ message: 'Doctor not found.' });
//     }
//     res.status(200).json(doctor);
//   } catch (error) {
//     console.error('Error fetching doctor:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };
// Update a doctor by ID
const updateDoctor = async (req, res) => {
  try {
    const updateFields = req.body;

    // Optional: prevent password/email from being updated by doctor directly
    delete updateFields.password;
    delete updateFields.email;

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
        // Merge slots for the same date
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
    // res.json({ availability: doctor.availability });
    // res.json({ availabilitySlots: doctor.availabilitySlots });
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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
