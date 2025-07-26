const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(403).json({ message: 'Token not found' });
    }
    jwt.verify(token, 'secret-123', (err, user) => {
        if (err) {
            console.log('JWT Error:', err); 
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
}

// Middleware to authorize only admin users
function authorizeAdmin(req, res, next) {
    console.log('authorizeAdmin - req.user:', req.user);
    if (req.user && req.user.role === 'admin') {
        console.log('Admin access granted');
        next();
    } else {
        console.log('Admin access denied');
        return res.status(403).json({ message: 'Admin access required' });
    }
}
module.exports = { authenticateToken, authorizeAdmin };
