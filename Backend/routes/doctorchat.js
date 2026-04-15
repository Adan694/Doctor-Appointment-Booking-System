const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const Chat = require('../models/chat');
const { User } = require('../models/users');
const Doctor = require('../models/doctors');
const mongoose = require('mongoose');

// 🟢 Mark messages as read for doctor (from admin)
router.post("/mark-read", authenticateToken, async (req, res) => {
  try {
    const doctorId = req.query.doctorId || req.user.id;
    
    if (!doctorId) {
      return res.status(400).json({ error: "doctorId is required" });
    }

    const result = await Chat.updateMany(
      { 
        receiverId: doctorId.toString(), 
        senderId: "689f5be6e5432f608d4b3a54", // From admin
        read: false 
      },
      { $set: { read: true } }
    );

    res.json({ 
      success: true, 
      markedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error("Error marking messages read:", err);
    res.status(500).json({ error: "Server error marking messages read" });
  }
});

// 🟢 Get message count for badge
router.get("/unread-count/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const count = await Chat.countDocuments({
      receiverId: doctorId,
      senderId: "689f5be6e5432f608d4b3a54",
      read: false
    });
    
    res.json({ count });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;