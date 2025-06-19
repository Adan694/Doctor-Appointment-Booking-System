const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {insertUser,
    authenticateUser,
    generateToken,
    sendOtpToEmail,
    verifyOtp,
    login,
    signup,
    requestOtp, forgotPassword, resetPassword} = require('../Controllers/AuthController'); 
const Otp = require('../models/otp');
const nodemailer = require('nodemailer');
const user = require('../models/users'); 
const Doctor = require('../models/doctors'); 

// POST endpoint for user signup
router.post('/signup', signup); // Calls the signup function

// POST endpoint for user login
router.post('/login', login); // Calls the login function

// POST endpoint to request OTP
router.post('/request-otp', requestOtp); // Calls the requestOtp function

// POST endpoint to verify OTP
router.post('/verify-otp', verifyOtp); // Calls the verifyOtp function
// Forgot Password Routes
router.post('/forgot-password', forgotPassword);   // Sends OTP
router.post('/reset-password', resetPassword);     // Verifies OTP + resets password


module.exports = router;