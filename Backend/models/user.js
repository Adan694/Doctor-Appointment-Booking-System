const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User schema definition
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'] // Email validation regex
    },
    password: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'doctor', 'patient'] // Define allowed roles
    }
}, { timestamps: true }); // Automatically handle createdAt and updatedAt

// Method to generate hashed passwords before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        return next(error); // Pass the error to the next middleware
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = {
    User
};