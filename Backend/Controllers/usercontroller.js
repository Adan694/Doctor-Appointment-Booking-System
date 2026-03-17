const { User } = require('../models/users');
const bcrypt = require('bcrypt');

async function insertUser(userData) {
  const user = new User(userData); 
  const savedUser = await user.save(); 
  return savedUser; 
}

async function getUsers() {
  const users = await User.find({}); 
  return users;
}

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving profile' });
    }
};


const updateUserProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.password || updateData.currentPassword) {
      const { password: newPassword, currentPassword } = updateData;

      if (!newPassword || !currentPassword) {
        return res.status(400).json({ message: 'Please provide current and new password.' });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long and include uppercase, lowercase, number, and special character.' });
      }

      const user = await User.findOne({ email: req.user.email });
      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentValid) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      updateData.password = hashedPassword;

      delete updateData.currentPassword;
    }

    if (!updateData.dob) delete updateData.dob;
    if (!updateData.age) delete updateData.age;

    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email },
      updateData,
      { new: true }
    ).select('-password'); 

    res.status(200).json({ message: 'Profile updated', updatedUser });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

const submitFeedback = async (req, res) => {
    try {
        const { message } = req.body;
        console.log(`Feedback from ${req.user.email}:`, message);

        res.status(200).json({ message: 'Feedback received. Thank you!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting feedback' });
    }
};
const Chat = require('../models/chat'); // make sure this is imported

// const getUnreadCount = async (req, res) => {
//     try {
//         const receiverId = req.user.email; // match what you store in Chat.receiverId
//         const count = await Chat.countDocuments({ receiverId, read: false });

//         res.status(200).json({ unreadCount: count });
//     } catch (error) {
//         console.error('Error getting unread messages count:', error);
//         res.status(500).json({ unreadCount: 0 });
//     }
// };
const getUnreadCount = async (req, res) => {
    try {
        // Get the user from the database to get their ID
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Use the user's _id (MongoDB ID) as a string to match the chat schema
        const count = await Chat.countDocuments({ 
            receiverId: user._id.toString(), // Convert ObjectId to string
            read: false 
        });

        console.log(`Unread count for user ${user.email}: ${count}`);
        res.status(200).json({ unreadCount: count });
    } catch (error) {
        console.error('Error getting unread messages count:', error);
        res.status(500).json({ unreadCount: 0 });
    }
};
const markMessagesAsRead = async (req, res) => {
    try {
        // find the logged-in user
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // mark all unread messages as read
        await Chat.updateMany(
            {
                receiverId: user._id.toString(),
                read: false
            },
            {
                $set: { read: true }
            }
        );

        res.status(200).json({ message: "Messages marked as read" });

    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ message: "Server error" });
    }
};
module.exports = {
    getUserProfile,
    updateUserProfile,
  submitFeedback,
  insertUser,
  getUsers,
  getUnreadCount,
      markMessagesAsRead

};
