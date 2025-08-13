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
        const doctor = await Doctor.findById(doctorId);
        const admin = await User.findOne({ role: 'admin' });

        const message = `📝 New feedback from ${user.name} for Dr. ${doctor.name}`;

        if (admin) {
            await Notification.create({
                userId: admin._id, 
                message: message
            });

            await notifyAll({
                patient: null,
                doctor,
                admin,
                message
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

        if (feedback.patientId.toString() !== user._id.toString()){
        return res.status(403).json({ message: 'Not authorized to edit this feedback' });
        }

        feedback.rating = rating;
        feedback.comment = comment;
        await feedback.save();

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
            .populate('patientId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Error getting feedback:', error);
        res.status(500).json({ message: 'Error retrieving feedback' });
    }
};

const getFeedbackNotificationCount = async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const count = await Notification.countDocuments({
            userId: admin._id,
            isRead: false
        });

        res.status(200).json({ count });
    } catch (error) {
        console.error('Error getting feedback notification count:', error);
        res.status(500).json({ message: 'Error retrieving notification count' });
    }
};

const markFeedbackNotificationAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error updating notification' });
    }
};

const markAllFeedbackNotificationsAsRead = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    await Notification.updateMany({ userId: admin._id, isRead: false }, { isRead: true });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
    submitFeedback,
    getFeedbackByDoctor,
    updateFeedback,
    deleteFeedback,
    getAllFeedback,
    getFeedbackNotificationCount,
    markFeedbackNotificationAsRead,
    markAllFeedbackNotificationsAsRead,
};
