const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  //Added
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
//Added
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
  photo: { type: String,}, 
  qualifications: String,
  services: String,
  conditions: String,
  memberships: String,
  locations: String,
  available: { type: Boolean, default: true },
  role: { type: String, default: 'doctor' },
  availabilitySlots: [
    {
      date: String,
      slots: [String]
    }
  ]
});

module.exports = mongoose.model('Doctor', doctorSchema);


