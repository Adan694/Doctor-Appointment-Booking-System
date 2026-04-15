const Chat = require("../models/chat");

// Stores online users { userId : { socketId, role } }
let onlineUsers = {};

function initializeSocket(io) {
  console.log("🔌 Socket.IO is running...");

  io.on("connection", (socket) => {
    console.log("🔗 User connected:", socket.id);

    /* ---------------------------------------
       USER LOGIN -> mark online + join room
    ---------------------------------------- */
    socket.on("join_user", ({ userId, role }) => {
      if (!userId) return;
      socket.join(userId);

      onlineUsers[userId] = { socketId: socket.id, role };
      console.log(`🟢 ${role} ${userId} is ONLINE`);

      io.emit("online_users", onlineUsers);
    });
console.log("🟢 Current online users:", onlineUsers);
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
      console.log(`📌 Admin joined room ${userId}`);
    });

    /* ---------------------------------------
             SEND MESSAGE
       saves DB + sends once to both users
    ---------------------------------------- */
    socket.on("send_message", async (data) => {
      const { senderId, receiverId } = data;
      if (!senderId || !receiverId) return;

      const chat = await Chat.create(data);

      // emit to sender + receiver without duplicates
      const recipients = new Set([senderId, receiverId]);
      recipients.forEach((id) => io.to(id).emit("new_message", chat));

      console.log(`💬 Message from ${senderId} -> ${receiverId}`);
    });
/* ---------------------------------------
   USER LOGOUT -> mark offline
---------------------------------------- */
socket.on("user_logout", ({ userId }) => {
  if (!userId) return;

  console.log(`🔴 ${userId} logged out`);

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
        console.log(`🔴 User ${removedUser} went OFFLINE`);
        delete onlineUsers[removedUser];
        io.emit("online_users", onlineUsers);
      }

      console.log("❌ Socket disconnected:", socket.id);
    });
  });
}

module.exports = { initializeSocket };
