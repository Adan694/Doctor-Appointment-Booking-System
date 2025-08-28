const { MongoClient } = require('mongodb');
require('dotenv').config(); 

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB:", error);
        process.exit(1); 
    }
}

module.exports = { client, connectToDatabase };