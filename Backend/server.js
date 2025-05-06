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

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

