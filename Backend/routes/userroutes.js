const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth'); 
const {
    getUserProfile,
    updateUserProfile,
    submitFeedback,
    insertUser,
    getUsers, getUnreadCount, markMessagesAsRead
} = require('../Controllers/usercontroller');

router.get('/profile', authenticateToken, getUserProfile);
router.put('/update', authenticateToken, updateUserProfile);
router.post('/feedback', authenticateToken, submitFeedback);
router.post('/users', authenticateToken, insertUser);
router.get('/users', authenticateToken, getUsers);
router.get('/chat/unread-count', authenticateToken, getUnreadCount);
router.post("/chat/mark-read", authenticateToken, markMessagesAsRead);
module.exports = router;
