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

    // Password change workflow
    if (updateData.password || updateData.currentPassword) {
      const { password: newPassword, currentPassword } = updateData;

      // Ensure all fields are filled
      if (!newPassword || !currentPassword) {
        return res.status(400).json({ message: 'Please provide current and new password.' });
      }

      // Password strength validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long and include uppercase, lowercase, number, and special character.' });
      }

      // Verify current password
      const user = await User.findOne({ email: req.user.email });
      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentValid) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      updateData.password = hashedPassword;

      // Remove currentPassword from updateData
      delete updateData.currentPassword;
    }

    // Clean up empty fields
    if (!updateData.dob) delete updateData.dob;
    if (!updateData.age) delete updateData.age;

    // Update user in DB
    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email },
      updateData,
      { new: true }
    ).select('-password'); // never send password

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

module.exports = {
    getUserProfile,
    updateUserProfile,
  submitFeedback,
  insertUser,
  getUsers
};
