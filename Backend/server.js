const express = require('express');
const bodyParser = require('body-parser');
const { connectToDatabase } = require('./config/db');
const { insertDoctor, getDoctors } = require('./models/doctors');
const cors = require('cors');
// If you are handling file uploads
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Middleware for parsing JSON

// Connect to MongoDB
connectToDatabase();

// Initialize multer for file uploads (optional)
const upload = multer({ dest: 'uploads/' }); // Customize upload directory

// POST endpoint to add a new doctor
app.post('/api/doctors/add', upload.single('doctorPicture'), async (req, res) => {
    const doctorData = req.body;

    // Basic validation
    if (!doctorData.name || !doctorData.speciality || !doctorData.email) {
        return res.status(400).send("Name, specialty, and email are required.");
    }

    // Optionally handle the uploaded file information
    if (req.file) {
        console.log(`Uploaded file: ${req.file.filename}`);
        // You can add the file information to doctorData if needed
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

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});