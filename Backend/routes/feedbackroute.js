const express = require('express');
const {
    submitFeedback,
    getFeedbackByDoctor,
    updateFeedback,
    deleteFeedback,
    getAllFeedback,
    getFeedbackByPatient,
} = require('../Controllers/FeedbackController');
const { authenticateToken } = require('../middlewares/auth'); 
const router = express.Router();

router.get('/doctors/:doctorId/feedback', getFeedbackByDoctor);
// router.put('/feedback/:id', updateFeedback);
// router.delete('/feedback/:id', deleteFeedback);
router.put('/feedback/:id', authenticateToken, updateFeedback);      
router.delete('/feedback/:id', authenticateToken, deleteFeedback);
router.post('/feedback', authenticateToken, submitFeedback);
router.get('/admin/all', authenticateToken, getAllFeedback);
router.get("/patient/:patientId", authenticateToken, getFeedbackByPatient);

module.exports = router;
