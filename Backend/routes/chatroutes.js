const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const ChatController = require('../Controllers/chatcontroller');
const Chat = require('../models/chat');  
const { User } = require('../models/users');
// Get chat messages between two users
router.get('/:userId/:contactId', authenticateToken, ChatController.getMessages);
router.get('/list/:userId', ChatController.getChatList);

// Send a new message
router.post('/send', authenticateToken, ChatController.sendMessage);

router.get("/all", async (req, res) => {
  try {
    // const patients = await User.find({ role: "patient", isBlocked: false })
          const patients = await User.find({ role: "patient"})

      .select("_id name email");
    // console.log("🧠 Total patients found:", patients.length);

    const chatsWithLastMsg = await Promise.all(
      patients.map(async (patient) => {
        const lastMessage = await Chat.findOne({
          $or: [
            { senderId: patient._id },
            { receiverId: patient._id }
          ]
        })
          .sort({ createdAt: -1 })
          .lean();
  // if (!lastMessage) {
  //         console.log("⚠️ No chat found for:", patient.name, patient._id);
  //       }
        const unreadCount = await Chat.countDocuments({
          senderId: patient._id,
          receiverRole: "admin",
          read: false
        });

        return {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
          lastMessage: lastMessage ? lastMessage.message : null,
          lastMessageAt: lastMessage ? lastMessage.createdAt : null,
          unreadCount,
          isUnread: unreadCount > 0,
        };
      })
    );
    // console.log("✅ Total chats with last message:", chatsWithLastMsg.length);

    // 🟢 Sort chats so the latest (or unread) are at the top
    chatsWithLastMsg.sort((a, b) => {
      // Sort by unread first, then by lastMessageAt
      if (b.unreadCount !== a.unreadCount)
        return b.unreadCount - a.unreadCount;
      return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
    });

    res.json(chatsWithLastMsg);
  } catch (err) {
    console.error("Error fetching patient list:", err);
    res.status(500).json({ error: "Server error fetching patients" });
  }
});

router.post("/mark-read/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    await Chat.updateMany(
      { senderId: patientId, receiverRole: "admin", read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking messages read:", err);
    res.status(500).json({ error: "Server error marking messages read" });
  }
});

router.delete('/clear/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await Chat.deleteMany({
      $or: [
        { senderId: '689f5be6e5432f608d4b3a54', receiverId: chatId },
        { senderId: chatId, receiverId: '689f5be6e5432f608d4b3a54' },
      ],
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No messages found to clear' });
    }

    res.json({ message: 'Chat messages cleared', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('❌ Error clearing chat:', err);
    res.status(500).json({ message: 'Server error clearing chat' });
  }
});

router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;

    const result = await Chat.deleteMany({
      $or: [
        { senderId: 'admin', receiverId: chatId },
        { senderId: chatId, receiverId: 'admin' },
      ],
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No messages found to delete' });
    }

    res.json({ message: 'Chat permanently deleted', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('❌ Error deleting chat:', err);
    res.status(500).json({ message: 'Server error deleting chat' });
  }
});

// In your chatRoutes.js (or create a new route)
const { isUserOnline, getAllOnlineUsers } = require('../Controllers/socketcontroller');

router.get("/online-status/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const isOnline = isUserOnline(userId);
        res.json({ userId, online: isOnline });
    } catch (err) {
        console.error("Error checking online status:", err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/online-users", async (req, res) => {
    try {
        const onlineUsers = getAllOnlineUsers();
        res.json({ onlineUsers, count: onlineUsers.length });
    } catch (err) {
        console.error("Error getting online users:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;