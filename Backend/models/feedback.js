
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Doctor',
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, 
        ref: 'User', 
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    userName: {
        type: String,
        required: true,
    },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    
});

module.exports = mongoose.model('Feedback', feedbackSchema);