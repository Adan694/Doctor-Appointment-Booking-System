const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/users'); 
const Otp = require('../models/otp'); 
const nodemailer = require('nodemailer');
const Doctor  = require('../models/doctors'); 


// Function to insert a new user into MongoDB
async function insertUser({ email, password, role }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, role });
    const savedUser = await newUser.save();
    return savedUser;
}

async function authenticateUser(email, password, role) {
    let user;

    if (role === 'doctor') {
        user = await Doctor.findOne({ email });
    } else {
        user = await User.findOne({ email, role }); // patient or admin
    }

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
}
function generateToken(user) {
    return jwt.sign({ email: user.email, role: user.role }, 'secret-123', { expiresIn: '1h' });
    console.log('\n================ JWT Token ================\n');
    console.log(token);
    console.log('\n===========================================\n');

    return token;
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
// Controller function for signup
async function signup(req, res) {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    if (role !== 'patient') {
        return res.status(403).json({ message: "Only patients are allowed to sign up." });
    }

    try {
        const userId = await insertUser({ email, password, role });
        res.status(201).json({ message: 'User registered successfully. OTP sent to email.', userId });
    } catch (error) {
        console.error("Error inserting user:", error.message);
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(409).json({ message: "User already exists with this email." });
        }
        res.status(500).json({ message: "Error registering user" });
    }
}

// Controller function for login
async function login(req, res) {
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

        if (role === 'doctor') {
            const doctor = await Doctor.findOne({ email: user.email });
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

        return res.status(200).json({
            message: 'Login successful',
            token,
            role: user.role,
            patientId: user._id
        });
    } catch (error) {
        console.error("Error logging in:", error.message);
        res.status(500).json({ message: "Error logging in" });
    }
}

// Controller function to request OTP
async function requestOtp(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        await sendOtpToEmail(email);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Error sending OTP:", error.message);
        res.status(500).json({ message: "Error sending OTP" });
    }
}

// Controller function to verify OTP
async function verifyOtpController(req, res) {
    const { email, otp } = req.body;
    try {
        const result = await verifyOtp(email, otp);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        res.status(400).json({ message: error.message });
    }
}
async function forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found." });
        }

        await sendOtpToEmail(email);
        res.status(200).json({ message: "OTP sent for password reset." });
    } catch (error) {
        console.error("Error in forgotPassword:", error.message);
        res.status(500).json({ message: "Failed to send OTP." });
    }
}
async function resetPassword(req, res) {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ message: "Email and new password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await User.updateOne({ email }, { password: hashedPassword });

        if (result.nModified === 0 && result.modifiedCount === 0) {
            return res.status(404).json({ message: "Failed to update password." });
        }

        res.status(200).json({ message: "Password reset successful." });
    } catch (error) {
        console.error("Error in resetPassword:", error.message);
        res.status(400).json({ message: error.message });
    }
}


module.exports = {
    insertUser,
    authenticateUser,
    generateToken,
    sendOtpToEmail,
    verifyOtp,
    login,
    signup,
    requestOtp,
    verifyOtp: verifyOtpController,
    forgotPassword,
    resetPassword,
};