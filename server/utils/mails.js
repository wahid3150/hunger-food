import nodemailer from "nodemailer";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Reset Your password",
    html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  });
};
