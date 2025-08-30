const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  cnic: {
    type: String,
    required: true,
    unique: true,
    match: /^([0-9]{5}-[0-9]{7}-[0-9]{1}|[0-9]{13})$/, 
  },
  name: String,
  phone: String,
  age: Number,
  dob: String,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  missedAppointments: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  blockedUntil: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  otp: { type: Number },
  otpExpiration: { type: Date },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = { User };
