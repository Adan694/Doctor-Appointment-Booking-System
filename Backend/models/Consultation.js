const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  roomId: { type: String, required: true, unique: true },
  
  // Patient details
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientAge: { type: Number },
  symptoms: { type: String, required: true },
  reportUrl: { type: String }, // For uploaded reports
  
  // Status flow: pending → accepted → active → completed
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'active', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  consultationType: { type: String, enum: ['video', 'audio'], default: 'video' },
  
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number }, // in seconds
  
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) } // 10 minutes expiry
});

// Index for faster queries
consultationSchema.index({ doctorId: 1, status: 1, createdAt: -1 });
consultationSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);