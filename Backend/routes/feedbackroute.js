const express = require('express');
const {
    submitFeedback,
    getFeedbackByDoctor,
    updateFeedback,
    deleteFeedback
} = require('../Controllers/FeedbackController');
const authenticateToken = require('../middlewares/auth');

// const auth = require('../middlewares/auth');
// const authenticateToken = require('../middlewares/auth');
const router = express.Router();

// router.post('/feedback', submitFeedback);
router.get('/doctors/:doctorId/feedback', getFeedbackByDoctor);
router.put('/feedback/:id', updateFeedback);
router.delete('/feedback/:id', deleteFeedback);
router.post('/feedback', authenticateToken, submitFeedback);


module.exports = router;
