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
const nodemailer = require('nodemailer');
const user = require('../models/users'); 
const Doctor = require('../models/doctors'); 

router.post('/signup', signup); 
router.post('/login', login); 
router.post('/request-otp', requestOtp); 
router.post('/verify-otp', verifyOtp); 
router.post('/forgot-password', forgotPassword);   
router.post('/reset-password', resetPassword);     


module.exports = router;