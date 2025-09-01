const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  speciality: { type: String, required: true },
  degree: { type: String, required: true, default: "Not specified" },
  // address1: { type: String, required: true },
  // address2: { type: String },
  experience: { type: String, required: true },
  fees: { type: Number, required: true },
  about: { type: String, required: true },
  photo: { type: String,}, 
  qualifications: String,
  services: String,
  conditions: String,
  memberships: String,
  locations: String,
  available: { type: Boolean, default: false }, 
  averageRating: { type: Number, default: 0 },  
  feedbackCount: { type: Number, default: 0 },
  role: { type: String, default: 'doctor' },
  availabilitySlots: [
    {
      date: String,
      slots: [String]
    }
  ]
}, { timestamps: true }); 

doctorSchema.pre('save', function (next) {
  if (this.availabilitySlots && this.availabilitySlots.length > 0) {
    const today = new Date().toISOString().split("T")[0]; 
    const todaySlot = this.availabilitySlots.find(s => s.date === today);
    this.available = todaySlot && todaySlot.slots.length > 0;
  } else {
    this.available = false;
  }
  next();
});


module.exports = mongoose.model('Doctor', doctorSchema);


