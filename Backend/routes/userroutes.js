const express = require('express');
const router = express.Router();
// const authenticateToken = require('../middlewares/auth');
const { authenticateToken } = require('../middlewares/auth'); 
const {
    getUserProfile,
    updateUserProfile,
    submitFeedback
} = require('../Controllers/usercontroller');

router.get('/profile', authenticateToken, getUserProfile);
router.put('/update', authenticateToken, updateUserProfile);
router.post('/feedback', authenticateToken, submitFeedback);
module.exports = router;
