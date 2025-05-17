// const express = require('express');
// const { insertDoctor, getDoctors } = require('../models/doctors');
// const router = express.Router();

// // POST endpoint to add a new doctor
// router.post('/', async (req, res) => {
//     const doctorData = req.body;

//     // Basic validation
//     if (!doctorData.name || !doctorData.specialty || !doctorData.email) {
//         return res.status(400).send("Name, specialty, and email are required.");
//     }

//     try {
//         const doctorId = await insertDoctor(doctorData);
//         res.status(201).json({ message: 'Doctor added successfully', doctorId });
//     } catch (error) {
//         console.error("Error inserting document:", error.message);
//         res.status(500).send("Error inserting document");
//     }
// });

// // GET endpoint to retrieve all doctors
// router.get('/', async (req, res) => {
//     try {
//         const doctors = await getDoctors();
//         res.status(200).json(doctors);
//     } catch (error) {
//         console.error("Error retrieving doctors:", error.message);
//         res.status(500).send("Error retrieving doctors");
//     }
// });

// module.exports = router;


const express = require('express');
const multer = require('multer');
const path = require('path');
const { addDoctor, getDoctors, updateDoctor, deleteDoctor, getDoctorById } = require('../Controllers/DoctorController');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/add', upload.single('photo'), addDoctor);
router.get('/', getDoctors);
router.put('/:id', upload.single('photo'), updateDoctor);
router.delete('/:id', deleteDoctor);
router.get('/alldoctors', getDoctors);
router.get('/:id', getDoctorById); // Add this line

// router.get('/doctor/:id', DoctorController.getDoctorProfile);
// router.get('/doctor/:id', getDoctorProfile); // For /doctor/:id

module.exports = router;
