const nodemailer = require("nodemailer");

const VerifyEmail = async (email, subject, text, isHTML = false) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.GMAIL_HOST,
            service: process.env.GMAIL_SERVICE,
            port: Number(process.env.GMAIL_PORT),
            secure: Boolean(process.env.GMAIL_SECURED),
            auth: {
                user: process.env.GMAIL_FROM_USER,
                pass: process.env.GMAIL_PASSWORD,   
            }
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: subject,
        };

        if (isHTML) {
            mailOptions.html = text;
        } else {
            mailOptions.text = text;
        }

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

module.exports = VerifyEmail;