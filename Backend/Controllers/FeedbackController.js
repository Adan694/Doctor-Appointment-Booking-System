const Feedback = require('../models/feedback');
// const User = require('../models/users'); // Import User model
const { User } = require('../models/users'); 

const submitFeedback = async (req, res) => {
    console.log('Decoded JWT user:', req.user); 

    try {
        const { doctorId, rating, comment } = req.body;

        // Assuming `req.user` is set by auth middleware and contains email
        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const feedback = new Feedback({
            doctorId,
            userId: user._id, 
            userName: user.name, 
            rating,
            comment
        });

        await feedback.save();

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get feedback by doctor ID
const getFeedbackByDoctor = async (req, res) => {
    const { doctorId } = req.params;

    try {
        const feedback = await Feedback.find({ doctorId });
        res.status(200).json(feedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving feedback' });
    }
};

// Update feedback by ID
const updateFeedback = async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const feedback = await Feedback.findById(id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        if (feedback.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        feedback.rating = rating;
        feedback.comment = comment;
        await feedback.save();

        res.status(200).json(feedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating feedback' });
    }
};

// Delete feedback by ID
const deleteFeedback = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const feedback = await Feedback.findById(id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        if (feedback.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Feedback.findByIdAndDelete(id);
        res.status(200).json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting feedback' });
    }
};

module.exports = {
    submitFeedback,
    getFeedbackByDoctor,
    updateFeedback,
    deleteFeedback,
};
