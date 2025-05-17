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
      available: req.body.available === 'true'
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

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    const doctorsWithImageUrl = doctors.map(doc => ({
      ...doc._doc,
      image: doc.photo ? `http://localhost:3000/uploads/${doc.photo}` : 'default.jpg'
    }));
    res.status(200).json(doctorsWithImageUrl);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving doctors' });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const updates = req.body;

    if (req.file) {
      updates.photo = req.file.filename;
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(doctorId, updates, { new: true });

    if (!updatedDoctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, doctor: updatedDoctor });
  } catch (err) {
    console.error("Error updating doctor:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
const deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);

    if (!deletedDoctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (err) {
    console.error("Error deleting doctor:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
const getDoctorById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-f]{24}$/)) {
      return res.status(400).json({ error: "Invalid doctor ID format" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Standardize response
    res.json({
      _id: doctor._id,
      name: doctor.name,
      speciality: doctor.speciality,
      experience: doctor.experience,
      available: doctor.available,
      about: doctor.about,
      image: doctor.photo 
        ? `http://localhost:3000/uploads/${doctor.photo}`
        : 'default.jpg'
    });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

module.exports = { addDoctor, getDoctors, updateDoctor, deleteDoctor, getDoctorById };
