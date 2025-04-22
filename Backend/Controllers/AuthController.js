const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/users'); // Correct model import

// Function to insert a new user into MongoDB
async function insertUser({ email, password, role }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, role });
    const savedUser = await newUser.save();
    return savedUser;
}

// Function to authenticate a user from MongoDB
async function authenticateUser(email, password) {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        return user;
    }
    return null;
}

// Function to generate a token
function generateToken(user) {
    return jwt.sign({ email: user.email, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
}

module.exports = {
    insertUser,
    authenticateUser,
    generateToken
};
