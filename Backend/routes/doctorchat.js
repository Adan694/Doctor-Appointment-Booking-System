const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const Chat = require('../models/chat');
const { User } = require('../models/users');
const Doctor = require('../models/doctors');
const mongoose = require('mongoose');

// 🟢 Get all doctors for admin chat list
// router.get("/alldoctors", async (req, res) => {
//   try {
//     const doctors = await Doctor.find()
//       .select("_id name email speciality available");

//     const chatsWithLastMsg = await Promise.all(
//       doctors.map(async (doctor) => {
//         // Find last message between this doctor and admin
//         const lastMessage = await Chat.findOne({
//           $or: [
//             { senderId: doctor._id, receiverId: "689f5be6e5432f608d4b3a54" },
//             { senderId: "689f5be6e5432f608d4b3a54", receiverId: doctor._id }
//           ]
//         })
//         .sort({ createdAt: -1 })
//         .lean();

//         // Count unread messages from doctor to admin
//         const unreadCount = await Chat.countDocuments({
//           senderId: doctor._id,
//           receiverId: "689f5be6e5432f608d4b3a54",
//           read: false
//         });

//         return {
//           _id: doctor._id,
//           name: doctor.name,
//           email: doctor.email,
//           speciality: doctor.speciality,
//           available: doctor.available,
//           lastMessage: lastMessage ? lastMessage.message : null,
//           lastMessageAt: lastMessage ? lastMessage.createdAt : null,
//           unreadCount,
//           isUnread: unreadCount > 0,
//         };
//       })
//     );

//     // 🟢 Sort doctors so unread chats appear first, then by latest message
//     chatsWithLastMsg.sort((a, b) => {
//       if (b.unreadCount !== a.unreadCount)
//         return b.unreadCount - a.unreadCount;
//       return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
//     });

//     res.json(chatsWithLastMsg);
//   } catch (err) {
//     console.error("Error fetching doctors list:", err);
//     res.status(500).json({ error: "Server error fetching doctors" });
//   }
// });

// // 🟢 Get chat messages between doctor and admin
// router.get("/:userId/:contactId", authenticateToken, async (req, res) => {
//   try {
//     const { userId, contactId } = req.params;
    
//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(contactId)) {
//       return res.status(400).json({ error: "Invalid user IDs" });
//     }

//     const messages = await Chat.find({
//       $or: [
//         { senderId: userId, receiverId: contactId },
//         { senderId: contactId, receiverId: userId },
//       ],
//     })
//     .sort({ createdAt: 1 })
//     .lean();

//     // Mark messages as read when doctor fetches them
//     if (userId !== "689f5be6e5432f608d4b3a54") { // If doctor is viewing
//       await Chat.updateMany(
//         { 
//           receiverId: userId, 
//           senderId: contactId,
//           read: false 
//         },
//         { $set: { read: true } }
//       );
//     }

//     res.json(messages);
//   } catch (err) {
//     console.error("Error fetching messages:", err);
//     res.status(500).json({ error: "Server error fetching messages" });
//   }
// });

// // 🟢 Send message
// router.post("/send", authenticateToken, async (req, res) => {
//   try {
//     const { senderId, receiverId, message, senderRole } = req.body;

//     if (!senderId || !receiverId || !message || !senderRole) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // Determine receiver role
//     const receiverRole = senderRole === "doctor" ? "admin" : "doctor";

//     const chat = new Chat({
//       senderId,
//       receiverId,
//       senderRole,
//       receiverRole,
//       message,
//       read: false
//     });

//     await chat.save();

//     // Get the populated chat for response
//     const savedChat = await Chat.findById(chat._id).lean();

//     res.status(201).json({ 
//       message: "Message sent successfully", 
//       chat: savedChat 
//     });

//   } catch (err) {
//     console.error("Error sending message:", err);
//     res.status(500).json({ error: "Server error sending message" });
//   }
// });

// // 🟢 Mark messages as read for admin viewing doctor's messages
// router.post("/mark-read/:doctorId", async (req, res) => {
//   try {
//     const { doctorId } = req.params;
    
//     await Chat.updateMany(
//       { 
//         senderId: doctorId, 
//         receiverId: "689f5be6e5432f608d4b3a54", 
//         read: false 
//       },
//       { $set: { read: true } }
//     );
    
//     res.json({ success: true });
//   } catch (err) {
//     console.error("Error marking messages as read:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // 🟢 Clear chat history for a doctor
// router.delete("/clear/:doctorId", async (req, res) => {
//   try {
//     const { doctorId } = req.params;
    
//     await Chat.deleteMany({
//       $or: [
//         { senderId: doctorId, receiverId: "689f5be6e5432f608d4b3a54" },
//         { senderId: "689f5be6e5432f608d4b3a54", receiverId: doctorId }
//       ],
//     });
    
//     res.status(200).json({ message: "Doctor chat cleared successfully" });
//   } catch (err) {
//     console.error("❌ Error clearing doctor chat:", err);
//     res.status(500).json({ error: "Server error while clearing doctor chat" });
//   }
// });

// // 🟢 GET unread messages for a doctor (from admin)
// router.get("/unread", authenticateToken, async (req, res) => {
//   try {
//     const doctorId = req.query.doctorId || req.user.id;

//     if (!doctorId) {
//       return res.status(400).json({ error: "Missing doctorId" });
//     }

//     const unreadMessages = await Chat.find({
//       receiverId: doctorId,
//       senderId: "689f5be6e5432f608d4b3a54", // From admin
//       read: false
//     }).lean();

//     res.json(unreadMessages);
//   } catch (err) {
//     console.error("Error fetching unread messages:", err);
//     res.status(500).json({ error: "Server error fetching unread messages" });
//   }
// });

// // 🟢 Mark messages as read for doctor (from admin)
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