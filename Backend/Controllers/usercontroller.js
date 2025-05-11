// controllers/usercontroller.js
const { User } = require('../models/users');

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
        const updatedUser = await User.findOneAndUpdate(
            { email: req.user.email },
            { ...req.body },
            { new: true }
        ).select('-password');

        res.status(200).json({ message: 'Profile updated', updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
};

const submitFeedback = async (req, res) => {
    try {
        // Save feedback to DB, or send to admin email – implement based on your schema
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
    submitFeedback
};
