const express = require('express');
const bodyParser = require('body-parser');
const { insertDoctor, getDoctors } = require('./models/doctors');
const { User } = require('./models/user');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const signupRoutes = require('./routes/signup'); // Update with the correct path


const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();  // Load environment variables

// Middleware
app.use(cors());
app.use(bodyParser.json());

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

// Rate limiting for login attempts
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many login attempts from this IP, please try again later."
});

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

// POST endpoint for user signup
app.post('/api/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." }); // Use json here
    }


    try {
            const user = new User({ email, password, role });
        await user.save();
        return res.status(201).json({ message: 'User created successfully.' }); // Use json here
    } catch (error) {
        console.error("Error during user signup:", error.message);
        return res.status(500).json({ error: 'Error during user signup' }); // Consistent use of json here
    }
});
// POST endpoint for user login with rate limiting
app.post('/api/login', limiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ message: 'Invalid email or password.' });
        }

        // Update user data (e.g., last login timestamp)
        user.lastLoginAt = new Date(); // Add a field in your User schema for this if not already present
        await user.save(); // Save the updated data

        const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
        return res.json({ message: 'Login successful.', token, role: user.role });
    } catch (error) {
        console.error("Error during login:", error.message);
        return res.status(500).send({ message: 'An error occurred during login. Please try again.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});