const nodemailer = require("nodemailer");
const logger = require("./logger");

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (process.env.NODE_ENV === "test") {
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SMTP email configuration is required in production");
  }

  return nodemailer.createTransport({
    jsonTransport: true
  });
};

const sendSignupOtp = async (email, otp) => {
  const transporter = createTransporter();
  const from = process.env.MAIL_FROM || "iPay <no-reply@ipay.local>";

  const info = await transporter.sendMail({
    from,
    to: email,
    subject: "Your iPay signup OTP",
    text: `Your iPay verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>Verify your iPay account</h2>
        <p>Your one-time password is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });

  if (!process.env.SMTP_HOST) {
    logger.warn("SMTP is not configured. OTP email used json transport.", {
      email,
      preview: info.message
    });
  }

  return info;
};

const sendPasswordResetOtp = async (email, otp) => {
  const transporter = createTransporter();
  const from = process.env.MAIL_FROM || "iPay <no-reply@ipay.local>";

  const info = await transporter.sendMail({
    from,
    to: email,
    subject: "Your iPay password reset OTP",
    text: `Your iPay password reset code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>Reset your iPay password</h2>
        <p>Your password reset code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });

  if (!process.env.SMTP_HOST) {
    logger.warn("SMTP is not configured. Password reset email used json transport.", {
      email,
      preview: info.message
    });
  }

  return info;
};

module.exports = {
  sendSignupOtp,
  sendPasswordResetOtp
};
