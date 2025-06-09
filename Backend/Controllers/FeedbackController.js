// const Feedback = require('../models/feedback');

// const feedbackController = {
//     submitFeedback: async (req, res) => {
//         const { doctorId, userId, rating, comment } = req.body;

//         try {
//             const feedback = new Feedback({ doctorId, userId, rating, comment });
//             await feedback.save();
//             res.status(201).json(feedback);
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ message: 'Error submitting feedback' });
//         }
//     },

//     getFeedbackByDoctor: async (req, res) => {
//         const { doctorId } = req.params;

//         try {
//             const feedback = await Feedback.find({ doctorId });
//             res.status(200).json(feedback);
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ message: 'Error retrieving feedback' });
//         }
//     },
// // Update feedback by ID
// updateFeedback: async (req, res) => {
//     const { id } = req.params;
//     const { rating, comment } = req.body;

//     try {
//         const updatedFeedback = await Feedback.findByIdAndUpdate(
//             id,
//             { rating, comment },
//             { new: true } // Return the updated document
//         );

//         if (!updatedFeedback) {
//             return res.status(404).json({ message: 'Feedback not found' });
//         }

//         res.status(200).json(updatedFeedback);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error updating feedback' });
//     }
// },

// // Delete feedback by ID
// deleteFeedback: async (req, res) => {
//     const { id } = req.params;

//     try {
//         const deletedFeedback = await Feedback.findByIdAndDelete(id);

//         if (!deletedFeedback) {
//             return res.status(404).json({ message: 'Feedback not found' });
//         }

//         res.status(200).json({ message: 'Feedback deleted successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error deleting feedback' });
//     }
// },
// };



// module.exports = feedbackController;

const Feedback = require('../models/feedback');

const feedbackController = {
    // Submit new feedback
    submitFeedback: async (req, res) => {
        const { doctorId, rating, comment } = req.body;
        const userId = req.user.id; // Get user ID from authentication

        try {
            const feedback = new Feedback({ doctorId, userId, rating, comment });
            await feedback.save();
            res.status(201).json(feedback);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error submitting feedback' });
        }
    },

    // Get feedback by doctor ID
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

    // Update feedback by ID
    updateFeedback: async (req, res) => {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id; // Get user ID from authentication

        try {
            const feedback = await Feedback.findById(id);
            if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
            if (feedback.userId.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });

            feedback.rating = rating;
            feedback.comment = comment;
            await feedback.save();

            res.status(200).json(feedback);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating feedback' });
        }
    },

    // Delete feedback by ID
    deleteFeedback: async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id; // Get user ID from authentication

        try {
            const feedback = await Feedback.findById(id);
            if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
            if (feedback.userId.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });

            await Feedback.findByIdAndDelete(id);
            res.status(200).json({ message: 'Feedback deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting feedback' });
        }
    },
};

module.exports = feedbackController;