const express = require('express');
const { User } = require('../models/user'); // Adjust the path if necessary
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    try {
        // Create a new user instance
        const newUser = new User({ email, password, role });
        
        // Save the user to the database
        await newUser.save();
        
        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Export the router
module.exports = router;