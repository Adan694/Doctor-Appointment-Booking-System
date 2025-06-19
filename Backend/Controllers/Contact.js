const nodemailer = require('nodemailer');
const Contact = require('../models/contact');

const handleContactForm = async (req, res) => {
    const { email, password, phone, message } = req.body;
    console.log('Received contact form submission:', req.body);


    if (!email || !password || !phone || !message) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        // 1. Save to database
        const newContact = new Contact({ email, password, phone, message });
        console.log('Saving to DB:', newContact);

        await newContact.save();

        // 2. Send email to admin
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'admin@gmail.com', 
            subject: 'New Contact Form Submission',
            html: `
                <h2>New Contact Submission</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Message:</strong><br>${message}</p>

            `
        };
        console.log('Email content being sent:', mailOptions);


        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Your query has been submitted and admin has been notified." });
    } catch (error) {
        console.error("Contact form error:", error.message);
        res.status(500).json({ message: "Failed to submit contact form." });
    }
};

module.exports = {
    handleContactForm
};
