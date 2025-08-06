const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  name: String,
    phone: String,
    age: Number,
    dob: String,
    gender: { type: String, enum: ['male', 'female', 'other'] },
});

// Create the User model based on the schema
const User = mongoose.model('User', userSchema);

// Function to insert a user
async function insertUser(userData) {
  const user = new User(userData); 
  const savedUser = await user.save(); 
  return savedUser; 
}

// Function to get all users
async function getUsers() {
  const users = await User.find({}); 
  return users;
}

// Export the functions and the User model
module.exports = { insertUser, getUsers, User };