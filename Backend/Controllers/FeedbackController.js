const Feedback = require('../models/feedback');

const feedbackController = {
    submitFeedback: async (req, res) => {
        const { doctorId, userId, rating, comment } = req.body;

        try {
            const feedback = new Feedback({ doctorId, userId, rating, comment });
            await feedback.save();
            res.status(201).json(feedback);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error submitting feedback' });
        }
    },

    getFeedbackByDoctor: async (req, res) => {
        const { doctorId } = req.params;

        try {
            const feedback = await Feedback.find({ doctorId });
            res.status(200).json(feedback);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error retrieving feedback' });
        }
    },
};

module.exports = feedbackController;