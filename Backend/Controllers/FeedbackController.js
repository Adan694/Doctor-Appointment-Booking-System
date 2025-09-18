const Feedback = require('../models/feedback');
const { User } = require('../models/users');
const notifyAll = require('../Utils/notifyAll');
const Doctor = require('../models/doctors');
const Notification = require('../models/Notification');

const submitFeedback = async (req, res) => {
    console.log('Decoded JWT user:', req.user);

    try {
        const { doctorId, appointmentId, rating, comment } = req.body;

        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const feedback = new Feedback({
            doctorId,
            appointmentId,
            patientId: user._id,
            userName: user.name,
            rating,
            comment,
        });

        await feedback.save();
        const feedbacks = await Feedback.find({ doctorId });
const avg =
  feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

await Doctor.findByIdAndUpdate(doctorId, {
  averageRating: avg.toFixed(1),
  feedbackCount: feedbacks.length,
});
        const doctor = await Doctor.findById(doctorId);
        const admin = await User.findOne({ role: 'admin' });

        const message = ` New feedback from ${user.name} for Dr. ${doctor.name}`;

        if (admin) {

            await notifyAll({
                patient: null,
                doctor: null,
                admin,
                message,
                type: 'feedback'
            });
        }
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

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

const updateFeedback = async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    console.log("Update request body:", req.body);
    console.log("Authenticated user:", req.user);

    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: 'Unauthorized: No user info' });
        }

        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const feedback = await Feedback.findById(id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

        if (feedback.patientId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this feedback' });
        }

        feedback.rating = rating;
        feedback.comment = comment;
        await feedback.save();
        const feedbacks = await Feedback.find({ doctorId: feedback.doctorId });
const avg =
  feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

await Doctor.findByIdAndUpdate(feedback.doctorId, {
  averageRating: avg.toFixed(1),
  feedbackCount: feedbacks.length,
});

        res.status(200).json(feedback);
    } catch (error) {
        console.error("Error in updateFeedback:", error);
        res.status(500).json({ message: 'Error updating feedback' });
    }
};

const deleteFeedback = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findOne({ email: req.user.email });
        console.log('Authenticated user:', req.user);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const feedback = await Feedback.findById(id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

        if (user.role !== 'admin') {
            if (!feedback.patientId) {
                return res.status(403).json({ message: 'Not authorized (no patientId)' });
            }
            console.log('Feedback.patientId:', feedback.patientId.toString());
            console.log('Logged in user._id:', user._id.toString());

            if (feedback.patientId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        } else {

            console.log('Admin deleting feedback:', feedback._id);
        }

        await Feedback.findByIdAndDelete(id);
        const feedbacks = await Feedback.find({ doctorId: feedback.doctorId });
const avg =
  feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

await Doctor.findByIdAndUpdate(feedback.doctorId, {
  averageRating: avg.toFixed(1),
  feedbackCount: feedbacks.length,
});
        res.status(200).json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error('Delete feedback error:', error);
        res.status(500).json({ message: 'Error deleting feedback' });
    }
};
const getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('doctorId', 'name')
            .populate('patientId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Error getting feedback:', error);
        res.status(500).json({ message: 'Error retrieving feedback' });
    }
};
const getFeedbackByPatient = async (req, res) => {
  const { patientId } = req.params;

  try {
    const feedbacks = await Feedback.find({ patientId });
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Error retrieving feedbacks for patient:", error);
    res.status(500).json({ message: "Error retrieving patient feedbacks" });
  }
};


module.exports = {
    submitFeedback,
    getFeedbackByDoctor,
    updateFeedback,
    deleteFeedback,
    getAllFeedback,
    getFeedbackByPatient,
};
