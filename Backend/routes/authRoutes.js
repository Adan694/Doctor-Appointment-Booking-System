const express = require('express');
const router = express.Router();
const { insertUser, authenticateUser, generateToken, sendOtpToEmail } = require('../Controllers/AuthController'); // Correct path
const Otp = require('../models/otp');
const nodemailer = require('nodemailer');



// POST endpoint for user signup
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    try {
        // const userId = await insertUser(email, password, role);
            const userId = await insertUser({ email, password, role });
        res.status(201).json({ message: 'User registered successfully. OTP sent to email.', userId });
    } catch (error) {
        console.error("Error inserting user:", error.message);
        res.status(500).json({ message: "Error registering user" });
    }
});

// POST endpoint for user login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const user = await authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = generateToken(user);
        res.status(200).json({ message: 'Login successful', token, role: user.role });
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

module.exports = router;