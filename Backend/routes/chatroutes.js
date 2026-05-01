const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
// const ChatController = require('../Controllers/chatcontroller');
const Chat = require('../models/chat');
const { User } = require('../models/users');

// Get chat history between admin & user


// Get chat history for a specific user (filtered by their role)
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const userRole = req.query.role; // Pass role as query param: ?role=doctor

  try {
    let query = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };

    // If role is provided, filter messages where user participates in correct role
    if (userRole === 'doctor') {
      query.$or = [
        { senderId: userId, senderRole: 'doctor' },
        { receiverId: userId, receiverRole: 'doctor' }
      ];
    } else if (userRole === 'patient') {
      query.$or = [
        { senderId: userId, senderRole: 'patient' },
        { receiverId: userId, receiverRole: 'patient' }
      ];
    } else if (userRole === 'admin') {
      query.$or = [
        { senderId: userId, senderRole: 'admin' },
        { receiverId: userId, receiverRole: 'admin' }
      ];
    }

    const chats = await Chat.find(query).sort({ createdAt: 1 });
    res.json(chats);
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ message: "Failed to load chat history" });
  }
});
// Get chat history between two specific users
router.get("/between/:user1Id/:user2Id", async (req, res) => {
  const { user1Id, user2Id } = req.params;

  try {
    const chats = await Chat.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id }
      ]
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch (err) {
    console.error("Error fetching chat between users:", err);
    res.status(500).json({ message: "Failed to load chat history" });
  }
});
// Get last message between two users (for preview)
router.get("/last/:user1Id/:user2Id", async (req, res) => {
  const { user1Id, user2Id } = req.params;
  try {
    const lastMessage = await Chat.findOne({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id }
      ]
    }).sort({ createdAt: -1 });
    res.json(lastMessage || null);
  } catch (err) {
    res.status(500).json({ message: "Failed to load last message" });
  }
});

// Get unread counts for doctor
router.get("/unread/doctor/:doctorId", async (req, res) => {
  const { doctorId } = req.params;
  try {
    const unreadMessages = await Chat.aggregate([
      { $match: { receiverId: doctorId, read: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);
    const result = {};
    unreadMessages.forEach(item => { result[item._id] = item.count; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to load unread counts" });
  }
});

// Get unread counts for patient
router.get("/unread/patient/:patientId", async (req, res) => {
  const { patientId } = req.params;
  try {
    const unreadMessages = await Chat.aggregate([
      { $match: { receiverId: patientId, read: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);
    const result = {};
    unreadMessages.forEach(item => { result[item._id] = item.count; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to load unread counts" });
  }
});

// Mark messages as read
router.put("/read/:senderId/:receiverId", async (req, res) => {
  const { senderId, receiverId } = req.params;
  try {
    await Chat.updateMany(
      { senderId: senderId, receiverId: receiverId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

// Save new message
router.post("/", async (req, res) => {
  const { senderId, senderRole, receiverId, receiverRole, message } = req.body;
  try {
    const newChat = new Chat({ 
      senderId, 
      senderRole, 
      receiverId, 
      receiverRole, 
      message,
      read: false
    });
    await newChat.save();
    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ message: "Failed to save message" });
  }
});
// Get chat history between doctor and patient (with optional limit)
router.get("/:doctorId/:patientId", async (req, res) => {
  const { doctorId, patientId } = req.params;
  const limit = parseInt(req.query.limit) || 0;
  
  try {
    let query = Chat.find({
      $or: [
        { senderId: doctorId, receiverId: patientId },
        { senderId: patientId, receiverId: doctorId }
      ]
    }).sort({ createdAt: 1 });
    
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const chats = await query;
    res.json(chats);
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ message: "Failed to load chat history" });
  }
});

router.put("/read/:senderId/:receiverId", async (req, res) => {
  const { senderId, receiverId } = req.params;
  try {
    await Chat.updateMany(
      { senderId: senderId, receiverId: receiverId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

module.exports = router;
