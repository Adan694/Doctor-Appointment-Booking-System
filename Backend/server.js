const express = require('express');
const { insertDoctor, getDoctors } = require('./models/doctors');
//const { User } = require('./models/user');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
//const signupRoutes = require('./routes/signup'); // Update with the correct path


const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();  // Load environment variables

// Middleware
app.use(cors());
app.use(express.json());
//app.use('/api', signupRoutes); // This is the correct usage



// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/appointment_system';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('Successfully connected to MongoDB');
})
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

// Initialize multer for file uploads
const upload = multer({ dest: 'uploads/' });



// POST endpoint to add a new doctor
app.post('/api/doctors/add', upload.single('doctorPicture'), async (req, res) => {
    const doctorData = req.body;

    // Basic validation
    if (!doctorData.name || !doctorData.speciality || !doctorData.email) {
        return res.status(400).send("Name, specialty, and email are required.");
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
        res.status(500).send("Error inserting document");
    }
});

// GET endpoint to retrieve all doctors
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await getDoctors();
        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error retrieving doctors:", error.message);
        res.status(500).send("Error retrieving doctors");
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});