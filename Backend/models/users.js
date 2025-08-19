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
  name: String,
  phone: String,
  age: Number,
  dob: String,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  missedAppointments: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  unblockDate: { type: Date, default: null },
  otp: { type: Number },
  otpExpiration: { type: Date },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = { User };
