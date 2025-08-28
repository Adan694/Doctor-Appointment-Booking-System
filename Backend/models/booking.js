const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    feedback: { type: String, default: "" },
    name: { type: String },
    normalizedName: { type: String },
    phone: { type: String },
    email: { type: String },
    age: { type: Number },
    token: { type: Number, required: true }, 
    patientNumber: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'missed'],
        default: 'pending'
    },
    issue: { type: String, default: "" },
    reminderSent24hr: { type: Boolean, default: false },
    reminderSent30min: { type: Boolean, default: false },
    }, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);