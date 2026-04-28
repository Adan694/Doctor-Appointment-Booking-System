const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
// const ChatController = require('../Controllers/chatcontroller');
const Chat = require('../models/chat');
const { User } = require('../models/users');

// Get chat history between admin & user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const chats = await Chat.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Failed to load chat history" });
  }
});



module.exports = router;
