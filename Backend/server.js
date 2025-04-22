const express = require('express');
const { insertDoctor, getDoctors } = require('./models/doctors');
const User = require('./models/users'); // Adjust the path if necessary
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path'); // Import the path module
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
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



//async function testCreateUser() {
  //const hashedPassword = await bcrypt.hash('testpassword', 10);
  //const user = new User({ email: 'test@example.com', password: hashedPassword, role: 'patient' });
  //await user.save();
 // console.log("Test user inserted");
//}

//testCreateUser();//





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
app.post('/auth/signup', async (req, res) => {
    const { email, password, role } = req.body;

    // Basic validation
    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    try {
        // Here you would typically hash the password and save the user
        const userId = await insertUser({ email, password, role });
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error("Error inserting user:", error.message);
        res.status(500).json({ message: "Error registering user" });
    }
});

// POST endpoint for user login
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;

    // Basic validation
    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    try {
        const user = await authenticateUser(email, password, role);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Here you would generate a token
        const token = generateToken(user);
        res.status(200).json({ message: 'Login successful', token, role: user.role });
    } catch (error) {
        console.error("Error logging in:", error.message);
        res.status(500).json({ message: "Error logging in" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});