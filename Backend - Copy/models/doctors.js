const { MongoClient } = require('mongodb');
const { client } = require('../config/db');

async function insertDoctor(doctor) {
    const database = client.db('appointment_system');
    const collection = database.collection('doctors');
    const result = await collection.insertOne(doctor);
    return result.insertedId;
}

async function getDoctors() {
    const database = client.db('appointment_system');
    const collection = database.collection('doctors');
    const doctors = await collection.find({}).toArray();
    return doctors;
}

module.exports = { insertDoctor, getDoctors };