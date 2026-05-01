const Chat = require("../models/chat");

// Stores online users { userId : { socketId, role } }
let onlineUsers = {};

function initializeSocket(io) {
  console.log(" Socket.IO is running...");

  io.on("connection", (socket) => {
    console.log(" User connected:", socket.id);

    /* ---------------------------------------
       USER LOGIN -> mark online + join room
    ---------------------------------------- */
    socket.on("join_user", ({ userId, role }) => {
      if (!userId) return;
      socket.join(userId);

      onlineUsers[userId] = { socketId: socket.id, role };
      console.log(` ${role} ${userId} is ONLINE`);

      io.emit("online_users", onlineUsers);
    });
console.log(" Current online users:", onlineUsers);
    /* ---------------------------------------
       ADMIN opened dashboard -> send list
    ---------------------------------------- */
    socket.on("admin_connected", () => {
      socket.emit("online_users", onlineUsers);
    });

    /* ---------------------------------------
         ADMIN opens a user's chat -> join room
    ---------------------------------------- */
    socket.on("admin_join", ({ userId }) => {
      if (!userId) return;
      socket.join(userId);
      console.log(` Admin joined room ${userId}`);
    });

    /* ---------------------------------------
             SEND MESSAGE
       saves DB + sends once to both users
    ---------------------------------------- */
    // WITH THIS:
/* ---------------------------------------
   SEND MESSAGE - Send to receiver only
---------------------------------------- */
socket.on("send_message", async (data) => {
  const { senderId, senderRole, receiverId, receiverRole, message, timestamp, createdAt } = data;
  
  if (!senderId || !receiverId) return;

  try {
    // Save to database
    const chat = await Chat.create({
      senderId,
      senderRole,
      receiverId,
      receiverRole,
      message,
      timestamp: timestamp || new Date(),
      createdAt: createdAt || new Date(),
      read: false
    });

    // ✅ Send to receiver ONLY (not to sender)
        io.to(senderId).emit("new_message", chat);

    io.to(receiverId).emit("new_message", chat);
    
    // ✅ Optionally send confirmation to sender (for read receipts)
    // io.to(senderId).emit("message_sent", { success: true, messageId: chat._id });

    console.log(`📨 Message from ${senderId} to ${receiverId}`);
  } catch (error) {
    console.error("Error saving message:", error);
  }
});
    // ADD THIS (after the join_user block):
socket.on("join_conversation", ({ userId, otherUserId }) => {
  if (!userId || !otherUserId) return;
  const roomId = [userId, otherUserId].sort().join("_");
  socket.join(roomId);
  console.log(`Joined conversation room: ${roomId}`);
});
/* ---------------------------------------
   USER LOGOUT -> mark offline
---------------------------------------- */
socket.on("user_logout", ({ userId }) => {
  if (!userId) return;

  console.log(` ${userId} logged out`);

  delete onlineUsers[userId];

  io.emit("online_users", onlineUsers);
});
    /* ---------------------------------------
         USER DISCONNECTED -> mark offline
    ---------------------------------------- */
    socket.on("disconnect", () => {
      let removedUser = null;

      Object.keys(onlineUsers).forEach((uid) => {
        if (onlineUsers[uid].socketId === socket.id) {
          removedUser = uid;
        }
      });

      if (removedUser) {
        console.log(` User ${removedUser} went OFFLINE`);
        delete onlineUsers[removedUser];
        io.emit("online_users", onlineUsers);
      }

      console.log(" Socket disconnected:", socket.id);
    });
  });
}

module.exports = { initializeSocket };
