const express = require('express');
const feedbackController = require('../Controllers/FeedbackController');

const router = express.Router();

router.post('/feedback', feedbackController.submitFeedback);
router.get('/doctors/:doctorId/feedback', feedbackController.getFeedbackByDoctor);

module.exports = router;