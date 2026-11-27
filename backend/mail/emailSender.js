const nodemailer = require("nodemailer");

/**
 * Sends a plain-text email via Gmail SMTP using environment credentials.
 */
const sendEmail = async (email, subject, message) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error("EMAIL_USER or EMAIL_PASS is not configured in environment.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const info = await transporter.sendMail({
      from: `Elite Saloon <${emailUser}>`,
      to: email,
      subject,
      text: message,
    });

    return Boolean(info && info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

module.exports = sendEmail;
