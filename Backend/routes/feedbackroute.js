const express = require('express');
const feedbackController = require('../Controllers/FeedbackController');

const router = express.Router();

router.post('/feedback', feedbackController.submitFeedback);
router.get('/doctors/:doctorId/feedback', feedbackController.getFeedbackByDoctor);
// Route to update feedback by ID
router.put('/feedback/:id', feedbackController.updateFeedback);

// Route to delete feedback by ID
router.delete('/feedback/:id', feedbackController.deleteFeedback);
module.exports = router;