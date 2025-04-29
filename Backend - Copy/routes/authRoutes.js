const express = require('express');
const router = express.Router();
const { insertUser, authenticateUser, generateToken } = require('../Controllers/AuthController'); // Correct path
const Otp = require('../models/otp');
const nodemailer = require('nodemailer');

async function sendOtpToEmail(email) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.deleteMany({ email }); // Remove old OTPs

    const otpEntry = new Otp({ email, otp, expiration });
    try {
        await otpEntry.save();
        console.log('OTP Entry Saved:', otpEntry);
    } catch (error) {
        console.error('Error saving OTP to database:', error);
        throw new Error('Failed to save OTP');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Verification',
        text: `Your OTP is: ${otp}. It is valid for 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
}

// POST endpoint for user signup
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    try {
    const userId = await insertUser({ email, password, role });
    await sendOtpToEmail(email); // <- Send OTP here
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

// Verify OTP Endpoint
// router.post('/verify-otp', async (req, res) => {
//     const { email, otp } = req.body;

//     const otpEntry = await Otp.findOne({ email });
//     if (!otpEntry || otpEntry.expiration < new Date()) {
//         return res.status(400).send('OTP not found or expired');
//     }

//     if (otpEntry.otp !== otp) {
//         return res.status(400).send('Invalid OTP');
//     }

//     await Otp.deleteOne({ email }); // Remove OTP after verification
//     res.status(200).send('OTP verified successfully');
// });

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const otpEntry = await Otp.findOne({ email });
    if (!otpEntry || otpEntry.expiration < new Date()) {
        return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (otpEntry.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    await Otp.deleteOne({ email }); // Remove OTP after verification
    res.status(200).json({ message: 'OTP verified successfully' });
});

module.exports = router;