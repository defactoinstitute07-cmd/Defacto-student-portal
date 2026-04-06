const nodemailer = require('nodemailer');

const parseBool = (value) => String(value || '').trim().toLowerCase() === 'true';

const getTransporter = () => {
    const host = String(process.env.SMTP_HOST || '').trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const user = String(process.env.SMTP_USER || '').trim();
    const pass = String(process.env.SMTP_PASS || '').trim();
    const secure = parseBool(process.env.SMTP_SECURE);

    if (!host || !user || !pass) {
        const error = new Error('SMTP settings are missing. Configure SMTP_HOST, SMTP_USER, and SMTP_PASS.');
        error.status = 503;
        throw error;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildAdminEmail = ({ student, ticket }) => {
    const name = escapeHtml(student?.name || 'Unknown Student');
    const rollNo = escapeHtml(student?.rollNo || '-');
    const email = escapeHtml(student?.email || '-');
    const className = escapeHtml(student?.className || '-');
    const batchName = escapeHtml(student?.batchName || '-');
    const category = escapeHtml(ticket?.category || 'General');
    const subject = escapeHtml(ticket?.subject || 'No subject');
    const message = escapeHtml(ticket?.message || '');
    const raisedAt = escapeHtml(ticket?.raisedAt || '-');

    return {
        subject: `New Support Ticket: ${subject}`,
        html: `
            <h2>New Student Support Ticket</h2>
            <p><strong>Raised At:</strong> ${raisedAt}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
            <hr/>
            <p><strong>Student Name:</strong> ${name}</p>
            <p><strong>Roll No:</strong> ${rollNo}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Class:</strong> ${className}</p>
            <p><strong>Batch:</strong> ${batchName}</p>
        `
    };
};

const buildStudentEmail = ({ student, ticket }) => {
    const name = escapeHtml(student?.name || 'Student');
    const category = escapeHtml(ticket?.category || 'General');
    const subject = escapeHtml(ticket?.subject || 'No subject');
    const message = escapeHtml(ticket?.message || '');
    const raisedAt = escapeHtml(ticket?.raisedAt || '-');

    return {
        subject: `Support Ticket Received: ${subject}`,
        html: `
            <h2>Hello ${name},</h2>
            <p>We have received your support request and shared it with the support team.</p>
            <p><strong>Raised At:</strong> ${raisedAt}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Your Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
            <p>Our team will get back to you soon.</p>
            <p>Regards,<br/>Student ERP Support</p>
        `
    };
};

const sendSupportTicketEmails = async ({ adminEmail, studentEmail, student, ticket }) => {
    const transporter = getTransporter();
    const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

    const adminMail = buildAdminEmail({ student, ticket });
    const studentMail = buildStudentEmail({ student, ticket });

    await Promise.all([
        transporter.sendMail({
            from,
            to: adminEmail,
            subject: adminMail.subject,
            html: adminMail.html
        }),
        transporter.sendMail({
            from,
            to: studentEmail,
            subject: studentMail.subject,
            html: studentMail.html
        })
    ]);
};

module.exports = {
    sendSupportTicketEmails
};
