const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection URI (Ensure this is correct)
const uri = "mongodb+srv://amnas:ashehzad1q2w3e@cluster0.1lllktq.mongodb.net/";
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
    const newDoctor = req.body; // Contains doctor data from web app

    // Basic validation
    if (!newDoctor.name || !newDoctor.specialization || !newDoctor.email) {
        return res.status(400).send("Name, specialization, and email are required.");
    }

    const database = client.db('appointment_system'); // Ensure this database exists
    const collection = database.collection('doctors');

    try {
        const result = await collection.insertOne(newDoctor);
        res.status(201).json({ message: "Doctor added successfully", doctor: result.ops[0] });
    } catch (error) {
        console.error("Error inserting document:", error.message); // Log more details
        res.status(500).send("Error inserting document");
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});