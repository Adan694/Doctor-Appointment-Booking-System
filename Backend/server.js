const express = require('express');
const http = require('http');             
const { Server } = require('socket.io');
const { User } = require('./models/users'); 
const Doctor = require('./models/doctors');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path'); 
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer'); 
const authRoutes = require('./routes/authroutes');
const userRoutes = require('./routes/userRoutes');
const doctorroutes = require('./routes/doctorroutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackroute = require('./routes/feedbackroute');
const bookingRoutes = require('./routes/bookingroutes'); 
const contactRoutes = require('./routes/contact');
const { initSocket } = require('./Controllers/socketcontroller');
const doctorChatRoutes = require('./routes/doctorchat'); 
const chatRoutes = require('./routes/chatroutes');

const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();  
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ['http://localhost:4200', 'http://localhost:5500', 'http://127.0.0.1:5500'],
//     methods: ['GET', 'POST'],
//  credentials: true
//   },
//   transports: ['websocket', 'polling'] // allow fallback
// });
// module.exports.io = io; // ✅ Export io for use in controllers

// const { verifySocketToken } = require('./middlewares/auth');

// io.use(verifySocketToken);

// initSocket(io);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:4200",
      "http://localhost:5500",
      "http://127.0.0.1:5500"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

const { initializeSocket } = require("./Controllers/socketcontroller");
initializeSocket(io);  // <-- VERY IMPORTANT FIX

console.log("✅ Socket.io initialized with server");

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api/appointments', bookingRoutes);
app.use('/auth', authRoutes); 
app.use(express.static('src')); 
app.use('/user', userRoutes);
app.use('/api/doctors', doctorroutes);
// app.use('/doctor', doctorroutes); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/api/feedback', feedbackroute);
app.use('/', contactRoutes);
app.use('/api/chats', require('./routes/chatroutes'));
app.use("/api/doctor-chats", require("./routes/doctorchat"));
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
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });
// Start the server (must use server, not app)
server.listen(port, () => {
  console.log(`🚀 Server running with Socket.IO at http://localhost:${port}`);
});


