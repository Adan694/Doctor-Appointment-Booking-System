const express = require('express');
const User = require('./models/users'); 
const Doctor = require('./models/doctors');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path'); 
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer'); 
const Otp = require('./models/otp'); 
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userroutes');
const doctorroutes = require('./routes/doctorroutes')
const feedbackroute = require('./routes/feedbackroute');
const bookingRoutes = require('./routes/bookingroutes'); 

const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();  // Load environment variables

// Enable CORS for all origins 
app.use(cors({
  origin: ['http://localhost:5501', 'http://127.0.0.1:5501'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api/appointments', bookingRoutes);
app.use('/auth', authRoutes); // Use the auth routes
app.use(express.static(path.join(__dirname, 'Frontend')));
app.use(express.static('src')); 
app.use('/user', userRoutes);
app.use('/api/doctors', doctorroutes);
app.use('/doctor', doctorroutes); // For view endpoints
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/api', feedbackroute);
app.use(session({
  secret: 'yourSecretKey', // Change this to a strong secret
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));
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
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

