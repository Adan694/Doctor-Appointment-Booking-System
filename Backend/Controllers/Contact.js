const nodemailer = require('nodemailer');
const Contact = require('../models/contact');

const handleContactForm = async (req, res) => {
    const { email, name, phone, message } = req.body;
    console.log('Received contact form submission:', req.body);


    if (!email || !name || !phone || !message) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        // 1. Save to database
        const newContact = new Contact({ email, name, phone, message });
        // console.log('Saving to DB:', newContact);

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
            // to: 'ashehzad0100@gmail.com', 
            to: 'kartizafar76@gmail.com', 
            subject: 'New Contact Form Submission',
            html: `
                <h2>New Contact Submission</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>name:</strong> ${name}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Message:</strong><br>${message}</p>

            `
        };
        // console.log('Email content being sent:', mailOptions.html);


        await transporter.sendMail(mailOptions);

        // 4. Confirmation email to user
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Query Recieved',
            html: `
                <p>Hi ${name},</p>
                <p>We have received your query. Our admin will contact you shortly.</p>
                <p>Thank you for reaching out to us!</p>
            `
        };

        await transporter.sendMail(userMailOptions);

        res.status(200).json({ message: "Your query has been submitted and admin has been notified." });
    } catch (error) {
        console.error("Contact form error:", error.message);
        res.status(500).json({ message: "Failed to submit contact form." });
    }
};

module.exports = {
    handleContactForm
};
