const mongoose = require('mongoose');

// Define the slot schema
const slotSchema = new mongoose.Schema({
    date: { type: String, required: true },
    slots: { type: [String], required: true } // This is an array of strings
});

// Define the availability schema
const availabilitySchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    availabilitySlots: { type: [slotSchema], default: [] } // This should be an array of slotSchema
});

// Export the Availability model
module.exports = mongoose.model('Availability', availabilitySchema);