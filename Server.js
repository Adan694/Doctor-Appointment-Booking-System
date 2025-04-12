// Import required packages
const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection URI
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Connect to MongoDB with error handling
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB:", error);
    }
}
connectToDatabase();

// POST endpoint to add a new doctor
app.post('/api/doctors', async (req, res) => {
    const doctorData = req.body; // Receiving data from the client

    // Basic validation
    if (!doctorData.name || !doctorData.specialization || !doctorData.email) {
        return res.status(400).send("Name, specialization, and email are required.");
    }

    const database = client.db('appointment_system'); // Ensure this database exists
    const collection = database.collection('doctors');

    try {
        const result = await collection.insertOne(doctorData);
        res.status(201).json({ message: 'Doctor added successfully', doctorId: result.insertedId });
    } catch (error) {
        console.error("Error inserting document:", error.message);
        res.status(500).send("Error inserting document");
    }
});

// GET endpoint to retrieve all doctors
app.get('/api/doctors', async (req, res) => {
    const database = client.db('appointment_system');
    const collection = database.collection('doctors');

    try {
        const doctors = await collection.find({}).toArray();
        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error retrieving doctors:", error.message);
        res.status(500).send("Error retrieving doctors");
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});