const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  name: String,
  email: String,
  phone: String,
  date: String,
  time: String,
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
