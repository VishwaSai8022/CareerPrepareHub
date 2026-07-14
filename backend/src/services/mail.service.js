import createMailerTransport from '../config/mailer.js';
import { env } from '../config/env.js';
import logger from '../logger/index.js';

const hasMailerConfig = () => Boolean(env.emailUser && env.emailPass);

const buildTransporter = () => {
  if (!hasMailerConfig()) {
    return null;
  }

  return createMailerTransport();
};

export const sendOtpEmail = async ({ to, otp, subject = 'Your OTP Code' }) => {
  const transporter = buildTransporter();

  if (!transporter) {
    logger.info(`[MAIL_STUB] OTP email skipped (no Gmail credentials). Recipient: ${to}, OTP: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: `"CareerPrepHub" <${env.emailUser}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:500px; margin:auto; background:white; padding:30px; border-radius:10px; text-align:center;">
          <h2 style="color:#333; margin-top:0;">CareerPrepHub Verification</h2>
          <p style="color:#555;">Use the OTP below to complete your request:</p>
          <div style="font-size:32px; font-weight:bold; letter-spacing:5px; margin:20px 0; color:#007bff;">
            ${otp}
          </div>
          <p style="color:#777;">This code expires in 5 minutes.</p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #e5e7eb;" />
          <p style="font-size:12px; color:#aaa; margin-bottom:0;">
            If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
    text: `Your OTP is ${otp}. This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.`,
  });
};

export const sendResetOtpEmail = async ({ to, otp }) => {
  await sendOtpEmail({
    to,
    otp,
    subject: 'CareerPrepHub Password Reset OTP',
  });
};