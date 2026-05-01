const express = require('express');
const router = express.Router();
const WaitingList = require('../models/WaitingList');
const { User } = require('../models/users');
const Doctor = require('../models/doctors'); // ← ADD THIS
const notifyAll = require('../Utils/notifyAll');

// JOIN waiting list
router.post('/join', async (req, res) => {
  const { patientId, doctorId, preferredDate, preferredTime, contactMethod } = req.body;
  
  try {
    const existing = await WaitingList.findOne({ 
      patientId, 
      doctorId, 
      status: 'waiting' 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already in the waiting list for this doctor' 
      });
    }
    
    const waitingEntry = new WaitingList({
      patientId,
      doctorId,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      preferredTime,
      contactMethod: contactMethod || 'email',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    
    await waitingEntry.save();

    // ========== ADD NOTIFICATION HERE ==========
    // Get patient and doctor details for notification
    const patient = await User.findById(patientId);
    const doctor = await Doctor.findById(doctorId);
    
    const formattedDate = preferredDate ? new Date(preferredDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Any available date';
    
    const formattedTime = preferredTime || 'Any available time';
    
    // Send notification to patient
    await notifyAll({
      patient: patient,
      message: `📋 You have been added to the WAITING LIST

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 REQUEST DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 Doctor: Dr. ${doctor.name}
📆 Preferred Date: ${formattedDate}
⏰ Preferred Time: ${formattedTime}

ℹ️ What happens next?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• You will be notified immediately when a slot opens up
• Your appointment will be automatically booked
• Slots are assigned on first-come, first-served basis
• Your waiting list request expires in 24 hours

Thank you for choosing DocAssist!`
    });
    
    // Optional: Notify doctor that someone joined waiting list
    await notifyAll({
      doctor: doctor,
      message: `📋 Patient ${patient.name} has joined your waiting list.

Preferred Date: ${formattedDate}
Preferred Time: ${formattedTime}

They will be automatically assigned when a slot opens up.`
    });
    // ========== END NOTIFICATION ==========
    
    res.status(201).json({
      success: true,
      message: 'Added to waiting list successfully',
      waitingEntry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET waiting list for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  const { doctorId } = req.params;
  
  try {
    const waitingList = await WaitingList.find({ 
      doctorId, 
      status: 'waiting' 
    })
    .populate('patientId', 'name email phone')
    .sort({ priority: 1, requestedAt: 1 });
    
    res.status(200).json(waitingList);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET waiting list for a patient
router.get('/patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  
  try {
    const waitingList = await WaitingList.find({ 
      patientId: patientId,
      status: 'waiting' 
    })
    .populate('doctorId', 'name specialty')
    .sort({ requestedAt: -1 });
    
    res.status(200).json(waitingList);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE priority
router.patch('/priority/:waitingId', async (req, res) => {
  const { waitingId } = req.params;
  const { priority } = req.body;
  
  try {
    const updated = await WaitingList.findByIdAndUpdate(
      waitingId,
      { priority },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Priority updated',
      waitingEntry: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// REMOVE from waiting list
router.delete('/:waitingId', async (req, res) => {
  try {
    await WaitingList.findByIdAndDelete(req.params.waitingId);
    res.status(200).json({ success: true, message: 'Removed from waiting list' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;