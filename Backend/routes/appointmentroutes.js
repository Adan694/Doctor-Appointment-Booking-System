const express = require('express');
const { createAvailability, getAvailability } = require('../Controllers/availabilityController');

const router = express.Router();

router.post('/availability', createAvailability); // To create availability
router.get('/availability/:id', getAvailability); // To fetch availability

module.exports = router;
