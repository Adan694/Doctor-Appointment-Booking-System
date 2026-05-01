const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientNumber: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  name: { type: String, required: true },
  normalizedName: { type: String },
  phone: { type: String },
  email: { type: String },
  age: { type: Number },
  token: { type: String },
  issue: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'missed'],
    default: 'pending'
  },
  arrivalTime: { type: Date, default: null },
  checkInDeadline: { type: Date, default: null },
  markedArrivedBy: { type: String, default: null },
  notifiedForCheckIn: { type: Boolean, default: false },
  noShowNotifiedAt: { type: Date, default: null },
  rescheduledBy: { type: String },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Fix: Check if model exists before creating
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

module.exports = Booking;