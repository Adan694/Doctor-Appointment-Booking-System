const express = require('express');
const { insertDoctor, getDoctors } = require('./models/doctors');
const User = require('./models/users'); // Adjust the path if necessary
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path'); // Import the path module
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer'); // Ensure this is imported
const Otp = require('./models/otp'); // Create a model for OTP
const authRoutes = require('./routes/authRoutes');


const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();  // Load environment variables

// Middleware
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes); // Use the auth routes
// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'Frontend')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Successfully connected to MongoDB');
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});



// Initialize multer for file uploads
const upload = multer({ dest: 'uploads/' });



// Define a root route
app.get('/', (req, res) => {
    res.send('Welcome to the Appointment Booking System API');
});

// POST endpoint to add a new doctor
app.post('/api/doctors/add', upload.single('doctorPicture'), async (req, res) => {
    const doctorData = req.body;

    // Basic validation
    if (!doctorData.name || !doctorData.speciality || !doctorData.email) {
        return res.status(400).json({ message: "Name, specialty, and email are required." });
    }

    // Handle uploaded file information if needed
    if (req.file) {
        console.log(`Uploaded file: ${req.file.filename}`);
    }

    try {
        const doctorId = await insertDoctor(doctorData);
        res.status(201).json({ message: 'Doctor added successfully', doctorId });
    } catch (error) {
        console.error("Error inserting document:", error.message);
        res.status(500).json({ message: "Error inserting document" });
    }
});

// GET endpoint to retrieve all doctors
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await getDoctors();
        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error retrieving doctors:", error.message);
        res.status(500).json({ message: "Error retrieving doctors" });
    }
});


// POST endpoint for user signup
//app.post('/auth/signup', async (req, res) => {
  //  const { email, password, role } = req.body;

    // Basic validation
    //if (!email || !password || !role) {
      //  return res.status(400).json({ message: "Email, password, and role are required." });
    //}

    //try {
        // Hash the password and save the user
      //  const hashedPassword = await bcrypt.hash(password, 10);
        //const userId = await User.create({ email, password: hashedPassword, role });
        //await requestOtp(email); // Send OTP after user creation
       // res.status(201).json({ message: 'User registered successfully, OTP sent to your email.' });
    //} catch (error) {
      //  console.error("Error inserting user:", error.message);
        //res.status(500).json({ message: "Error registering user" });
    //}
//});

// POST endpoint for user login
//app.post('/api/login', async (req, res) => {
   // const { email, password, role } = req.body;

    // Basic validation
    //if (!email || !password || !role) {
      //  return res.status(400).json({ message: "Email, password, and role are required." });
    //}

    //try {
      //  const user = await authenticateUser(email, password, role);
        //if (!user) {
          //  return res.status(401).json({ message: "Invalid credentials." });
        //}

        // Here you would generate a token
        //const token = generateToken(user);
        //res.status(200).json({ message: 'Login successful', token, role: user.role });
    //} catch (error) {
      //  console.error("Error logging in:", error.message);
        //res.status(500).json({ message: "Error logging in" });
   // }
//});
// Request OTP Endpoint
// app.post('/auth/request-otp', async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ message: "Email is required." });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
//     const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//     await Otp.deleteMany({ email }); // Delete any existing OTPs for this email

//     const otpEntry = new Otp({ email, otp, expiration });

//     try {
//         await otpEntry.save(); // Save the OTP
//         console.log('OTP saved successfully:', otpEntry);
//     } catch (error) {
//         console.error('Error saving OTP:', error);
//         return res.status(500).json({ message: 'Error saving OTP' });
//     }

//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS
//         }
//     });

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Your OTP for Verification',
//         text: `Your OTP is: ${otp}. It is valid for 10 minutes.`
//     };

//     transporter.sendMail(mailOptions, (error) => {
//         if (error) {
//             console.error('Error sending email:', error);
//             return res.status(500).json({ message: 'Error sending OTP' });
//         }
//         res.status(200).json({ message: 'OTP sent successfully' });
//     });
// });




// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

