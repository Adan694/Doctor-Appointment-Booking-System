const Chat = require('../models/chat');
const { io } = require('../server'); 
const { getIo } = require('./socketcontroller');

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const chat = new Chat({ senderId, receiverId, message });
    await chat.save();
    res.status(201).json({ message: 'Message sent successfully', chat });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.getMessages = async (req, res) => {
  try {
    const { userId, contactId } = req.params;

    const messages = await Chat.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getChatList = async (req, res) => {
  try {
    const { userId } = req.params;

    const chatList = await Chat.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
       {
    $sort: { createdAt: 1 }   // IMPORTANT!
  },
      {
        $group: {
          _id: {
            pair: {
              $cond: [
                { $gt: ["$senderId", "$receiverId"] },
                ["$senderId", "$receiverId"],
                ["$receiverId", "$senderId"],
              ],
            },
          },
          lastMessage: { $last: "$message" },
          lastSender: { $last: "$senderId" },
          lastReceiver: { $last: "$receiverId" },
          lastUpdated: { $max: "$updatedAt" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$read", false] }, { $eq: ["$receiverId", userId] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastUpdated: -1 } },
    ]);

    res.json(chatList);
  } catch (error) {
    console.error('Error fetching chat list:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
