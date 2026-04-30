import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendDeliveryOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Your Delivery OTP",
    html: `
      <p>Your delivery OTP is <b>${otp}</b>.</p>
      <p>This code will expire in 10 minutes.</p>
      <p>Please share it with the delivery rider to complete your order.</p>
    `,
  });
};
