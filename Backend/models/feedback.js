
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Doctor',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, // Ensure this is required
        ref: 'User', // Reference to the User model
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
    
});

module.exports = mongoose.model('Feedback', feedbackSchema);