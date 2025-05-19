const Doctor = require('../models/doctors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


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
      res.status(200).json(doctor);
  } catch (error) {
      console.error('Error fetching doctor:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update a doctor by ID
const updateDoctor = async (req, res) => {
  try {
      const { name, email, specialization, phone } = req.body;
      const doctor = await Doctor.findByIdAndUpdate(
          req.params.id,
          { name, email, specialization, phone },
          { new: true, runValidators: true }
      );

      if (!doctor) {
          return res.status(404).json({ message: 'Doctor not found.' });
      }

      res.status(200).json({ message: 'Doctor updated successfully.', doctor });
  } catch (error) {
      console.error('Error updating doctor:', error);
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

module.exports = { addDoctor, getDoctors, updateDoctor, deleteDoctor, getDoctorById};
