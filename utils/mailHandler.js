const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Thay bằng email thật
        pass: 'your-app-password'     // Thay bằng App Password
    }
});

module.exports = {
    sendMail: async function (to, subject, text) {
        try {
            await transporter.sendMail({
                from: '"Sport Shop" <no-reply@sportshop.com>',
                to: to,
                subject: subject,
                text: text
            });
            return true;
        } catch (error) {
            console.error("Mail error:", error);
            return false;
        }
    }
};