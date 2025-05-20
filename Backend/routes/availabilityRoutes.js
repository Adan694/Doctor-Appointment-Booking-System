const express = require('express');
const { createAvailability, getAvailability, updateAvailability} = require('../Controllers/availabilityController');

const router = express.Router();

// Route to create availability
router.post('/doctors/:id/availability', createAvailability); // Create availability

// Route to fetch availability by doctor ID
router.get('/doctors/:id/availability', getAvailability); // Fetch availability
router.put('/doctors/:id/availability', updateAvailability);

// Route to update availability
// router.put('/doctors/:id/availability', updateAvailability); // Update availability

module.exports = router;