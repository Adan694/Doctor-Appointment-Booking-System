// const { MongoClient } = require('mongodb');
// const { client } = require('../config/db');

// async function insertDoctor(doctor) {
//     const database = client.db('appointment_system');
//     const collection = database.collection('doctors');
//     const result = await collection.insertOne(doctor);
//     return result.insertedId;
// }

// async function getDoctors() {
//     const database = client.db('appointment_system');
//     const collection = database.collection('doctors');
//     const doctors = await collection.find({}).toArray();
//     return doctors;
// }

// module.exports = { insertDoctor, getDoctors };

// const mongoose = require('mongoose');

// const doctorSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   speciality: { type: String, required: true },
//   degree: { type: String, required: true },
//   address1: { type: String, required: true },
//   address2: { type: String },
//   experience: { type: String, required: true },
//   fees: { type: Number, required: true },
//   about: { type: String, required: true },
//   photo: { type: String }, // filename of uploaded image
// });

// module.exports = mongoose.model('Doctor', doctorSchema);


const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String },
    experience: { type: String, required: true },
    fees: { type: Number, required: true },
    about: { type: String, required: true },
    photo: { type: String }, // filename of uploaded image
  available: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    default: 'doctor' // Set default role as "doctor"
}
});

module.exports = mongoose.model('Doctor', doctorSchema);


