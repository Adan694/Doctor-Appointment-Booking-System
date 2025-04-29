const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Function to connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB:", error);
        process.exit(1); // Exit process on error
    }
}

module.exports = { client, connectToDatabase };