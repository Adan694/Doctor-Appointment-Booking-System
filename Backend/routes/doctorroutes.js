const express = require('express');
const multer = require('multer');
const path = require('path');
const { addDoctor, getDoctors, updateDoctor, deleteDoctor, getDoctorById, updateDoctorAvailability, getDoctorAvailability, deleteDoctorAvailabilitySlot } = require('../Controllers/DoctorController');
const auth = require('../middlewares/auth');

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
// router.put('/:id/availability', auth, updateDoctorAvailability);  // Add this line
router.put('/:id/availability', updateDoctorAvailability);  // Add this line
// router.get('/doctors/:id/availability', getDoctorAvailability);
router.get('/:id/availability', getDoctorAvailability);
router.delete("/:id/availability/:date", deleteDoctorAvailabilitySlot);



module.exports = router;
