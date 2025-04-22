const express = require('express');
const router = express.Router();
const { insertUser, authenticateUser, generateToken } = require('../Controllers/AuthController'); // Correct path

// POST endpoint for user signup
router.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required." });
    }

    try {
        const userId = await insertUser({ email, password, role });
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error("Error inserting user:", error.message);
        res.status(500).json({ message: "Error registering user" });
    }
});

// POST endpoint for user login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const user = await authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = generateToken(user);
        res.status(200).json({ message: 'Login successful', token, role: user.role });
    } catch (error) {
        console.error("Error logging in:", error.message);
        res.status(500).json({ message: "Error logging in" });
    }
});

module.exports = router;