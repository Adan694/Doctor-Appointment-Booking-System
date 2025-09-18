const express = require('express');
const { User } = require('./models/users'); 
const Doctor = require('./models/doctors');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path'); 
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer'); 
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userroutes');
const doctorroutes = require('./routes/doctorroutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackroute = require('./routes/feedbackroute');
const bookingRoutes = require('./routes/bookingroutes'); 
const contactRoutes = require('./routes/contact');

const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();  

app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); 
app.use(express.json());
app.use('/api/appointments', bookingRoutes);
app.use('/auth', authRoutes); 
app.use(express.static('src')); 
app.use('/user', userRoutes);
app.use('/api/doctors', doctorroutes);
app.use('/doctor', doctorroutes); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/api', feedbackroute);
app.use('/', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use(express.static(path.join(__dirname, 'Frontend')));
app.use(session({
  secret: 'yourSecretKey', 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Successfully connected to MongoDB');

   require('./cron/unblockPatients'); 
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

app.post('/contact', async (req, res) => {
  const { email, password, phone } = req.body;

  try {
      const newContact = new Contact({ email, name, phone });
      await newContact.save();
      res.json({ message: 'Contact form submitted and saved!' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error saving contact info.' });
  }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


