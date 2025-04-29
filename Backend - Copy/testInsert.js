const mongoose = require('mongoose');
const User = require('./models/users'); // Adjust the path if necessary

const mongoURI = 'mongodb://localhost:27017/appointment_system'; // Replace with your URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB');
        const user = new User({ 
            email: 'test@example.com', 
            password: 'password', 
            role: 'user' 
        });
        await user.save();
        console.log('User saved:', user);
        mongoose.disconnect();
    })
    .catch(err => {
        console.error('Error:', err);
    });