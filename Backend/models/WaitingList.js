const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  preferredDate: { 
    type: Date, 
    default: null 
  },
  preferredTime: { 
    type: String, 
    default: null 
  },
  priority: { 
    type: Number, 
    default: 1  // 1 = highest priority, 5 = lowest
  },
  status: { 
    type: String, 
    enum: ['waiting', 'assigned', 'cancelled'], 
    default: 'waiting' 
  },
  requestedAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
  },
  contactMethod: { 
    type: String, 
    enum: ['email', 'sms', 'both'], 
    default: 'email' 
  },
  notifiedAt: { 
    type: Date, 
    default: null 
  }
});

// Add index for faster queries
waitingListSchema.index({ doctorId: 1, status: 1, priority: 1, requestedAt: 1 });
waitingListSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired entries

const WaitingList = mongoose.models.WaitingList || mongoose.model('WaitingList', waitingListSchema);

module.exports = WaitingList;