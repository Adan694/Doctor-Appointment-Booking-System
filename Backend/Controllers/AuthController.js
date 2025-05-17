const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/users'); // Correct model import
const Otp = require('../models/otp'); // Import Otp model
const nodemailer = require('nodemailer');

// Function to insert a new user into MongoDB
async function insertUser({ email, password, role }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, role });
    const savedUser = await newUser.save();
    return savedUser;
}

// Function to authenticate a user from MongoDB
async function authenticateUser(email, password) {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        return user;
    }
    return null;
}

// Function to generate a token
function generateToken(user) {
    return jwt.sign({ email: user.email, role: user.role }, 'secret-123', { expiresIn: '1h' });
}

async function sendOtpToEmail(email) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.deleteMany({ email }); // Remove old OTPs

    // const otpEntry = new Otp({ email, otp, expiration });
    const otpEntry = new Otp({ email, otp: Number(otp), expiration });

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

async function verifyOtp(email, otp) {
    console.log('Verifying OTP:', { email, otp });

    if (!email || !otp) {
        throw new Error('Email and OTP are required.');
    }

    const otpEntry = await Otp.findOne({ email });
    console.log('Database OTP Entry:', otpEntry);

    if (!otpEntry || otpEntry.expiration < new Date()) {
        throw new Error('OTP not found or expired');
    }
    
    // Convert both to numbers for comparison
    const inputOtp = Number(otp);
    const storedOtp = Number(otpEntry.otp);
    
    console.log('Comparing OTP:', { input: inputOtp, stored: storedOtp });
    if (inputOtp !== storedOtp) {
        throw new Error('Invalid OTP');
    }

    await Otp.deleteOne({ email });
    return { success: true, message: 'OTP verified successfully' };
}

module.exports = {
    insertUser,
    authenticateUser,
    generateToken,
    sendOtpToEmail,
    verifyOtp
};




