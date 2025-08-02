const express = require('express');
const {
    submitFeedback,
    getFeedbackByDoctor,
    updateFeedback,
    deleteFeedback
} = require('../Controllers/FeedbackController');
const { authenticateToken } = require('../middlewares/auth'); 
const router = express.Router();

router.get('/doctors/:doctorId/feedback', getFeedbackByDoctor);
// router.put('/feedback/:id', updateFeedback);
// router.delete('/feedback/:id', deleteFeedback);
router.put('/feedback/:id', authenticateToken, updateFeedback);      // ✅ Protect this
router.delete('/feedback/:id', authenticateToken, deleteFeedback);
router.post('/feedback', authenticateToken, submitFeedback);


module.exports = router;
