const express = require('express');
const router = express.Router();
const { Resend } = require('resend');

router.post('/ticket', async (req, res) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set in environment variables');
            return res.status(500).json({ success: false, message: 'Support ticket system is currently unavailable.' });
        }
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { name, rollNo, issue, description, whatsappNumber, preferredContactMethod } = req.body;

        if (!name || !rollNo || !issue || !description || !preferredContactMethod) {
            return res.status(400).json({ success: false, message: 'All required fields are missing.' });
        }

        const data = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'ighost474@gmail.com',
            subject: `New Support Request: ${issue}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
                    <h2 style="color: #191838; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Support Ticket</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Student ID / Email:</strong> ${rollNo}</p>
                    <p><strong>WhatsApp Number:</strong> ${whatsappNumber ? whatsappNumber : 'Not provided'}</p>
                    <p><strong>Preferred Contact Method:</strong> <span style="color: #10b981; font-weight: bold;">${preferredContactMethod}</span></p>
                    <p><strong>Issue:</strong> <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${issue}</span></p>
                    <div style="margin-top: 20px;">
                        <strong>Description:</strong>
                        <p style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #191838; border-radius: 4px; margin-top: 5px;">${description}</p>
                    </div>
                </div>
            `
        });

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Support ticket email error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
