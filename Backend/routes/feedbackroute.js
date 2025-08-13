const express = require('express');
const {
    submitFeedback,
    getFeedbackByDoctor,
    updateFeedback,
    deleteFeedback,
    getAllFeedback,
    getFeedbackNotificationCount,
    markFeedbackNotificationAsRead,
    markAllFeedbackNotificationsAsRead
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
router.get('/admin/notifications/count', authenticateToken, getFeedbackNotificationCount);
router.patch('/admin/notifications/:id/read', markFeedbackNotificationAsRead); 
router.patch('/notifications/mark-all-read', authenticateToken, markAllFeedbackNotificationsAsRead);


module.exports = router;
