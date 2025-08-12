const Feedback = require('../models/feedback');
const { User } = require('../models/users'); 
const notifyAll = require('../Utils/notifyAll');
const Doctor = require('../models/doctors'); 



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

        const message = `📝 New Feedback Received

Patient: ${user.name}
Doctor: Dr. ${doctor.name}
Rating: ${rating}/5
Comment: ${comment}
Date: ${new Date().toLocaleString()}

Regards,
DocAssist`;
        if (admin) {
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

// Delete feedback by ID
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
            // for admin you can log safely without checking patientId existence if you want
            console.log('Admin deleting feedback:', feedback._id);
        }

        await Feedback.findByIdAndDelete(id);
        res.status(200).json({ message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error('Delete feedback error:', error);
        res.status(500).json({ message: 'Error deleting feedback' });
    }
};


module.exports = {
    submitFeedback,
    getFeedbackByDoctor,
    updateFeedback,
    deleteFeedback,
};
