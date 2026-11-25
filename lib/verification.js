import { HttpError } from './api';
import { sendEmail, otpEmail, emailConfigured } from './email';
import { hashValue, newOtp, OTP_TTL_MS, RESEND_WAIT_MS } from './otp';

/** Creates a fresh 6-digit code for this user and emails it. */
export async function sendVerificationCode(user, { force = false } = {}) {
  const last = user.emailOtp?.sentAt ? new Date(user.emailOtp.sentAt).getTime() : 0;
  const wait = last + RESEND_WAIT_MS - Date.now();
  if (!force && wait > 0) throw new HttpError(429, `Please wait ${Math.ceil(wait / 1000)} seconds before asking for a new code.`);
  const code = newOtp();
  user.emailOtp = { hash: hashValue(`${user._id}:${code}`), expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, sentAt: new Date() };
  await user.save();
  const mail = otpEmail(user.firstName || user.name, code);
  await sendEmail({ to: user.email, toName: user.name, ...mail });
  return { emailConfigured: emailConfigured() };
}
