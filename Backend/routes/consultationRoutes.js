const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const { User } = require('../models/users');
const Doctor = require('../models/doctors');
const notifyAll = require('../Utils/notifyAll');

// Generate unique room ID
function generateRoomId() {
  return 'consult_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

// ========== PATIENT: Request Consultation ==========
router.post('/request', async (req, res) => {
  const { 
    patientId, doctorId, patientName, patientEmail, 
    patientPhone, patientAge, symptoms, consultationType, reportUrl 
  } = req.body;
  
  try {
    // Check for existing pending request
    const existing = await Consultation.findOne({
      patientId,
      doctorId,
      status: { $in: ['pending', 'accepted', 'active'] }
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending consultation with this doctor',
        roomId: existing.roomId
      });
    }
    
    const roomId = generateRoomId();
    
    const consultation = new Consultation({
      patientId,
      doctorId,
      roomId,
      patientName,
      patientEmail,
      patientPhone,
      patientAge: patientAge || null,
      symptoms,
      consultationType: consultationType || 'video',
      reportUrl: reportUrl || null,
      status: 'pending'
    });
    
    await consultation.save();
    
    // Send notification to doctor
    const doctor = await Doctor.findById(doctorId);
    const patient = await User.findById(patientId);
    
    await notifyAll({
      doctor: doctor,
      message: `🔔 NEW CONSULTATION REQUEST!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Patient: ${patientName}
📧 Email: ${patientEmail}
📞 Phone: ${patientPhone}
🎂 Age: ${patientAge || 'Not specified'}
🤒 Symptoms: ${symptoms}
⏰ Requested at: ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Click here to accept: http://localhost:5500/doctor-consult-queue.html`
    });
    
    res.status(201).json({
      success: true,
      message: 'Consultation request sent to doctor',
      roomId: roomId,
      status: 'pending'
    });
    
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== DOCTOR: Get Pending Requests (Queue) ==========
router.get('/doctor/:doctorId/pending', async (req, res) => {
  const { doctorId } = req.params;
  
  try {
    const consultations = await Consultation.find({
      doctorId,
      status: 'pending'
    })
    .sort({ createdAt: 1 }) // Oldest first (FIFO queue)
    .select('patientName patientPhone symptoms createdAt roomId patientAge');
    
    res.json({ success: true, consultations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== DOCTOR: Get Accepted Requests (Waiting for call) ==========
router.get('/doctor/:doctorId/accepted', async (req, res) => {
  const { doctorId } = req.params;
  
  try {
    const consultations = await Consultation.find({
      doctorId,
      status: 'accepted'
    })
    .populate('patientId', 'name email')
    .sort({ createdAt: 1 });
    
    res.json({ success: true, consultations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== PATIENT: Check Status of Request ==========
router.get('/patient/:patientId/status', async (req, res) => {
  const { patientId } = req.params;
  
  try {
    const consultation = await Consultation.findOne({
      patientId,
      status: { $in: ['pending', 'accepted', 'active'] }
    })
    .sort({ createdAt: -1 });
    
    if (!consultation) {
      return res.json({ success: true, hasActiveRequest: false });
    }
    
    res.json({ 
      success: true, 
      hasActiveRequest: true,
      status: consultation.status,
      roomId: consultation.roomId,
      doctorId: consultation.doctorId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// GET completed consultations for a doctor
router.get('/doctor/:doctorId/completed', async (req, res) => {
    const { doctorId } = req.params;
    
    try {
        const consultations = await Consultation.find({
            doctorId,
            status: { $in: ['completed', 'ended'] }
        })
        .sort({ endedAt: -1 })
        .limit(50);
        
        res.json({ success: true, consultations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== Get Consultation Details by Room ID ==========
router.get('/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    const consultation = await Consultation.findOne({ roomId })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialty');
    
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }
    
    res.json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== DOCTOR: Accept Consultation ==========
router.put('/:roomId/accept', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    await Consultation.updateOne(
      { roomId },
      { status: 'accepted' }
    );
    
    const consultation = await Consultation.findOne({ roomId });
    
    // Notify patient that doctor accepted
    const patient = await User.findById(consultation.patientId);
    const doctor = await Doctor.findById(consultation.doctorId);
    
    await notifyAll({
      patient: patient,
      message: `✅ DOCTOR ACCEPTED YOUR REQUEST!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍⚕️ Doctor: Dr. ${doctor.name}
⏰ Your consultation has been accepted!

Click below to join the video call:
http://localhost:5500/patient-call.html?roomId=${roomId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    });
    
    res.json({ success: true, message: 'Consultation accepted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Start Consultation (set active) ==========
router.put('/:roomId/start', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    await Consultation.updateOne(
      { roomId },
      { status: 'active', startedAt: new Date() }
    );
    
    res.json({ success: true, message: 'Consultation started' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== End Consultation ==========
router.put('/:roomId/end', async (req, res) => {
  const { roomId } = req.params;
  const { duration } = req.body;
  
  try {
    await Consultation.updateOne(
      { roomId },
      { status: 'completed', endedAt: new Date(), duration: duration }
    );
    
    res.json({ success: true, message: 'Consultation ended' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Reject Consultation ==========
router.put('/:roomId/reject', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    await Consultation.updateOne({ roomId }, { status: 'rejected' });
    res.json({ success: true, message: 'Consultation rejected' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Cancel Consultation (by patient) ==========
router.put('/:roomId/cancel', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    await Consultation.updateOne({ roomId }, { status: 'cancelled' });
    res.json({ success: true, message: 'Consultation cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET Consultation History for Patient ==========
router.get('/patient/:patientId/history', async (req, res) => {
  const { patientId } = req.params;
  
  try {
    const consultations = await Consultation.find({ 
      patientId,
      status: { $in: ['completed', 'rejected', 'cancelled'] }
    })
    .populate('doctorId', 'name specialty')
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json({ success: true, consultations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all consultations for a patient (pending, accepted, active, completed)
router.get('/patient/:patientId/all', async (req, res) => {
    const { patientId } = req.params;
    
    try {
        const consultations = await Consultation.find({ patientId })
            .populate('doctorId', 'name specialty')
            .sort({ createdAt: -1 });
        
        res.json({ success: true, consultations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;