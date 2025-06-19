// middlewares/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(403).json({ message: 'Token not found' });
    }

    //     jwt.verify(token, 'secret-123', (err, user) => {
    //         if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    //         req.user = user; // { email, role }
    //         next();
    //     });
    // }
    jwt.verify(token, 'secret-123', (err, user) => {
        if (err) {
            console.log('JWT Error:', err); // Add this
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
