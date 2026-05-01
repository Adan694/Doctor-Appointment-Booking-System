const Chat = require("../models/chat");

// Stores online users { userId : { socketId, role } }
let onlineUsers = {};
let consultationRooms = {};

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
      // Intentionally no-op.
      //
      // Previously, admin joined the same room named by `userId`.
      // Since messages are emitted to rooms `senderId` and `receiverId`,
      // that caused admin to receive doctor<->patient messages whenever
      // admin had opened either user's chat.
      //
      // Admin already receives admin<->user messages via the admin's own
      // room (admin joins their own userId room via `join_user`).
      if (!userId) return;
      console.log(` Admin view opened for user ${userId}`);
    });

    /* ---------------------------------------
       SEND MESSAGE - Send to both users
    ---------------------------------------- */
    socket.on("send_message", async (data) => {
      const { senderId, senderRole, receiverId, receiverRole, message, timestamp, createdAt } = data;
      
      if (!senderId || !receiverId) return;

      try {
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

        // Emit ONLY to the private conversation room for these two users.
        // This prevents other roles from receiving each other's messages.
        const roomId = [senderId, receiverId].sort().join("_");
        io.to(roomId).emit("new_message", chat);
        console.log(`📨 Message from ${senderId} to ${receiverId}`);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });
    
    /* ---------------------------------------
       JOIN CONVERSATION ROOM
    ---------------------------------------- */
    socket.on("join_conversation", ({ userId, otherUserId }) => {
      if (!userId || !otherUserId) return;
      const roomId = [userId, otherUserId].sort().join("_");
      socket.join(roomId);
      console.log(`Joined conversation room: ${roomId}`);
    });

    /* ---------------------------------------
       ========== VIDEO CONSULTATION ==========
    ---------------------------------------- */
    
    // Join consultation room - IMPORTANT: Both users join the SAME room
    socket.on("join_consultation", ({ roomId, userId, role }) => {
      if (!roomId || !userId) return;
      socket.join(roomId);
      
      if (!consultationRooms[roomId]) {
        consultationRooms[roomId] = { users: [] };
      }
      consultationRooms[roomId].users.push({ userId, role, socketId: socket.id });
      
      console.log(`${role} ${userId} joined consultation room ${roomId}`);
      console.log(`Users in room ${roomId}:`, consultationRooms[roomId].users.map(u => u.userId));
      
      // Notify other users in the same room
      socket.to(roomId).emit("user_joined", { userId, role });
    });

    // WebRTC Offer - Send to ALL other users in the room
    socket.on("consultation_offer", ({ roomId, offer }) => {
      if (!roomId) return;
      console.log(`📤 Offer sent to room ${roomId}`);
      socket.to(roomId).emit("consultation_offer", { offer });
    });

    // WebRTC Answer - Send to ALL other users in the room
    socket.on("consultation_answer", ({ roomId, answer }) => {
      if (!roomId) return;
      console.log(`📤 Answer sent to room ${roomId}`);
      socket.to(roomId).emit("consultation_answer", { answer });
    });

    // WebRTC ICE Candidate - Send to ALL other users in the room
    socket.on("consultation_ice", ({ roomId, candidate }) => {
      if (!roomId) return;
      socket.to(roomId).emit("consultation_ice", { candidate });
    });

    // Leave consultation
    socket.on("leave_consultation", ({ roomId, userId }) => {
      if (!roomId) return;
      
      if (consultationRooms[roomId]) {
        consultationRooms[roomId].users = consultationRooms[roomId].users.filter(u => u.userId !== userId);
        if (consultationRooms[roomId].users.length === 0) {
          delete consultationRooms[roomId];
        }
      }
      socket.to(roomId).emit("user_left", { userId });
      socket.leave(roomId);
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