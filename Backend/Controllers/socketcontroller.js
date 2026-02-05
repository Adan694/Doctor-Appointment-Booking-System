// const { Server } = require("socket.io");
// const Chat = require("../models/chat");
// const { User } = require("../models/users");
// const Doctor = require("../models/doctors");

// console.log("🚀 SOCKETCONTROLLER.JS LOADED — REAL-TIME READY");

// let io;

// function initializeSocket(server) {
//   io = new Server(server, {
//     cors: {
//       origin: ["http://localhost:5500", "http://localhost:3000"],
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   console.log("✅ Socket.io Ready");

//   io.on("connection", async (socket) => {
//     console.log("\n============================");
//     console.log("🔌 SOCKET CONNECTED:", socket.id);

//     const { token, role, email, userId } = socket.handshake.auth || {};
//     console.log("📥 Auth data:", { token, role, email, userId });

//     // Assign minimal info immediately
//     socket.userInfo = { userId: userId || null, role: role || null, name: email || null };

//     try {
//       let user = null;

//       // 1️⃣ Lookup user by ID
//       if (userId) user = (await User.findById(userId)) || (await Doctor.findById(userId));

//       // 2️⃣ Fallback by email
//       if (!user && email) {
//         if (role === "doctor") user = await Doctor.findOne({ email });
//         else if (role === "patient") user = await User.findOne({ email });
//       }

//       // 3️⃣ Admin virtual connection
//       if (!user && role === "admin") {
//         socket.userInfo = { userId: "ADMIN-VIRTUAL-ID", role: "admin", name: email || "Admin" };
//         console.log("👑 Admin connected without DB record");
//       }

//       // 4️⃣ If no valid user, disconnect
//       if (!socket.userInfo.userId && !user) {
//         console.log("❌ No valid user — disconnecting socket");
//         return socket.disconnect();
//       }

//       // 5️⃣ Assign final info from DB if available
//       if (user) {
//         socket.userInfo.userId = user._id.toString();
//         socket.userInfo.role = user.role || role || "patient";
//         socket.userInfo.name = user.name || email;
//       }

//       console.log("🧾 Socket User:", socket.userInfo);

//       // 6️⃣ Join a room named after userId for direct messaging
//       socket.join(socket.userInfo.userId);
//       console.log(`📦 Socket joined room: ${socket.userInfo.userId}`);

//       // 7️⃣ Admin-specific welcome
//       if (socket.userInfo.role === "admin") {
//         socket.emit("admin_identity", {
//           message: "Connected as admin",
//           adminId: socket.userInfo.userId,
//           socketId: socket.id,
//           timestamp: new Date().toISOString(),
//         });
//       }
// // Add this helper function at the top of sockecontroler.js:
// function debugSocketState(io, targetUserId = null) {
//   console.log("\n🔍 ============ SOCKET STATE DEBUG ============");
  
//   // Get adapter rooms
//   const adapter = io.sockets.adapter;
//   console.log("📦 Adapter Rooms:");
//   if (adapter.rooms) {
//     adapter.rooms.forEach((sockets, roomName) => {
//       console.log(`  • "${roomName}" (${sockets.size} sockets)`);
//     });
//   }
  
//   // Get all sockets
//   console.log("👥 Connected Sockets:");
//   io.sockets.sockets.forEach((socket, socketId) => {
//     console.log(`  • ${socketId}:`);
//     console.log(`    - User: ${socket.userInfo?.userId || 'Unknown'}`);
//     console.log(`    - Role: ${socket.userInfo?.role || 'Unknown'}`);
//     console.log(`    - Rooms: ${Array.from(socket.rooms).join(', ')}`);
    
//     // Check if this socket matches targetUserId
//     if (targetUserId && socket.userInfo?.userId === targetUserId.toString()) {
//       console.log(`    ✅ MATCHES TARGET USER ID: ${targetUserId}`);
//     }
//   });
  
//   // Check if targetUserId is in any room
//   if (targetUserId) {
//     const targetStr = targetUserId.toString();
//     console.log(`🎯 Looking for user "${targetStr}" in rooms:`);
    
//     let found = false;
//     adapter.rooms.forEach((sockets, roomName) => {
//       if (roomName === targetStr) {
//         console.log(`  ✅ FOUND in room: "${roomName}"`);
//         found = true;
//       }
//     });
    
//     if (!found) {
//       console.log(`  ❌ NOT FOUND in any room with name "${targetStr}"`);
      
//       // Check variations
//       console.log(`  🔄 Checking variations...`);
//       adapter.rooms.forEach((sockets, roomName) => {
//         if (roomName.includes(targetStr) || targetStr.includes(roomName)) {
//           console.log(`  ⚠️  Partial match: room "${roomName}" might be related`);
//         }
//       });
//     }
//   }
  
//   console.log("=============================================\n");
// }
//       /* ---------------------------------------------------------
//        * 📩 MESSAGE SEND / RECEIVE
//        * --------------------------------------------------------- */
//      // In sockecontroler.js, update the send_message handler:
// socket.on("send_message", async (msg) => {
//   console.log("📤 SEND_MESSAGE EVENT RECEIVED:", {
//     msg,
//     socketUser: socket.userInfo,
//     allRooms: Array.from(socket.rooms)
//   });

//   try {
//     // Normalize IDs to strings
//     const senderId = msg.senderId ? msg.senderId.toString() : null;
//     const receiverId = msg.receiverId ? msg.receiverId.toString() : null;
    
//     if (!senderId || !receiverId) {
//       console.error("❌ Missing senderId or receiverId");
//       return socket.emit("error", { message: "Missing IDs" });
//     }

//     // Determine receiverRole
//     let receiverRole = "user";
//     if (msg.senderRole === "admin") {
//       receiverRole = msg.chatType === "patients" ? "patient" : "doctor";
//     } else if (msg.senderRole === "doctor") {
//       receiverRole = "admin";
//     } else if (msg.senderRole === "patient") {
//       receiverRole = "admin";
//     }

//     // Save to DB
//     const chat = await Chat.create({
//       senderId: senderId,
//       receiverId: receiverId,
//       message: msg.message,
//       senderRole: msg.senderRole,
//       receiverRole: receiverRole,
//       read: false,
//       timestamp: new Date(),
//     });

//     console.log("💾 Message saved to DB:", chat._id);

//     // Create enriched message data
//     const messageData = {
//       _id: chat._id,
//       senderId: senderId,
//       receiverId: receiverId,
//       message: msg.message,
//       senderRole: msg.senderRole,
//       receiverRole: receiverRole,
//       timestamp: chat.timestamp || new Date(),
//       chatType: msg.chatType,
//       delivered: true
//     };

//     // 🔥 CRITICAL: Send to sender (acknowledgement)
//     socket.emit("receive_message", messageData);
//     console.log("📨 Message sent back to sender");

//     // 🔥 CRITICAL: Send to receiver in MULTIPLE ways
//     // 1. By receiverId (primary)
//     io.to(receiverId).emit("receive_message", messageData);
//     console.log(`📤 Emitted to room: ${receiverId}`);
    
//     // 2. Broadcast to all connected sockets that match receiverId
//     io.sockets.sockets.forEach((sock) => {
//       if (sock.userInfo && sock.userInfo.userId === receiverId) {
//         sock.emit("receive_message", messageData);
//         console.log(`📤 Direct emit to socket: ${sock.id}`);
//       }
//     });

//     // 3. Debug: Log all connected users
//     console.log("👥 Currently connected users:");
//     io.sockets.sockets.forEach((sock) => {
//       console.log(`  - Socket: ${sock.id}, User: ${sock.userInfo?.userId}, Role: ${sock.userInfo?.role}`);
//     });

//     // 4. Also emit a broadcast for debugging
//     io.emit("message_broadcast_debug", {
//       from: senderId,
//       to: receiverId,
//       message: msg.message,
//       timestamp: new Date().toISOString()
//     });

//   } catch (err) {
//     console.error("❌ Message send failed:", err);
//     socket.emit("error", { 
//       message: "Failed to send message", 
//       error: err.message,
//       stack: err.stack 
//     });
//   }
// });      /* ---------------------------------------------------------
//        * 🔧 TEST EVENTS
//        * --------------------------------------------------------- */
//       socket.on("test_connection", () => {
//         socket.emit("test_response", {
//           message: "Connection OK",
//           socketId: socket.id,
//           timestamp: new Date().toISOString(),
//         });
//       });

//       /* ---------------------------------------------------------
//        * 🔌 DISCONNECT
//        * --------------------------------------------------------- */
//       socket.on("disconnect", (reason) => {
//         console.log(`🔻 Socket ${socket.id} DISCONNECTED — reason: ${reason}`);
//         console.log("User:", socket.userInfo);
//       });
//     } catch (err) {
//       console.error("❌ Socket error:", err);
//       socket.disconnect();
//     }
//   });
// }

// /* ---------------------------------------------------------
//  * Getter for io
//  * --------------------------------------------------------- */
// function getIo() {
//   if (!io) throw new Error("❌ Socket not initialized");
//   return io;
// }

// module.exports = { initializeSocket, getIo };
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
