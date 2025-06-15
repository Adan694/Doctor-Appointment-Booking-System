const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { insertUser, authenticateUser, generateToken, sendOtpToEmail, verifyOtp } = require('../Controllers/AuthController'); // Correct path
const Otp = require('../models/otp');
const nodemailer = require('nodemailer');
const user = require('../models/users'); // Or correct path to your User model
const Doctor = require('../models/doctors'); // Doctor model





// POST endpoint for user signup
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    if (role !== 'patient') {
    return res.status(403).json({ message: "Only patients are allowed to sign up." });
  }

    try {
        // const userId = await insertUser(email, password, role);
            const userId = await insertUser({ email, password, role });
        res.status(201).json({ message: 'User registered successfully. OTP sent to email.', userId });
    } catch (error) {
        console.error("Error inserting user:", error.message);
        // res.status(500).json({ message: "Error registering user" });
        if (error.code === 11000 && error.keyPattern?.email) {
    return res.status(409).json({ message: "User already exists with this email." });
}
res.status(500).json({ message: "Error registering user" });

    }
});

router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    try {
        const user = await authenticateUser(email, password, role);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = generateToken(user);

        // 🔍 Doctor-specific data
        if (role === 'doctor') {
            const doctor = await Doctor.findOne({ email: user.email }); // Make sure this matches your DB structure
            if (!doctor) {
                return res.status(404).json({ message: "Doctor not found." });
            }

            return res.status(200).json({
                message: 'Login successful',
                token,
                role: doctor.role,
                doctor: {
                    _id: doctor._id,
                    name: doctor.name,
                    email: doctor.email
                }
            });
        }

        // 👤 Response for other roles (e.g., admin, patient)
        // return res.status(200).json({
        //     message: 'Login successful',
        //     token,
        //     role: user.role
        // });
            return res.status(200).json({
                message: 'Login successful',
                token,
                role: user.role,
                patientId: user._id // Include patientId
            });
    } catch (error) {
        console.error("Error logging in:", error.message);
        res.status(500).json({ message: "Error logging in" });
    }
});


// POST endpoint to request OTP (added this to handle OTP separately)
router.post('/request-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        await sendOtpToEmail(email); // Send OTP here
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Error sending OTP:", error.message);
        res.status(500).json({ message: "Error sending OTP" });
    }
});


// Update the verify-otp route
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await verifyOtp(email, otp);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        res.status(400).json({ message: error.message });
    }
});

router.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You are not logged in" });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({ email: user.email, role: user.role });
});
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Could not log out" });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;