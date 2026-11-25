import { handler, json, readBody, HttpError } from '@/lib/api';
import { User } from '@/lib/models';
import { hashValue, safeEqual, OTP_MAX_ATTEMPTS } from '@/lib/otp';

// Step 2 of sign-up: check the 6-digit code from the email
export const POST = handler(async (req) => {
  const { email, code } = await readBody(req);
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user) throw new HttpError(404, 'No account found for this email. Please sign up again.');
  if (user.emailVerified !== false) return json({ ok: true, alreadyVerified: true });

  const otp = user.emailOtp || {};
  if (!otp.hash || !otp.expiresAt || new Date(otp.expiresAt) < new Date()) {
    throw new HttpError(400, 'This code has expired. Click "Send a new code".');
  }
  if ((otp.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many wrong attempts. Click "Send a new code".');
  }
  const clean = String(code || '').replace(/\D/g, '');
  if (!safeEqual(hashValue(`${user._id}:${clean}`), otp.hash)) {
    const used = (otp.attempts || 0) + 1;
    user.set('emailOtp.attempts', used);
    await user.save();
    const left = OTP_MAX_ATTEMPTS - used;
    throw new HttpError(400, left > 0 ? `Wrong code. ${left} attempt${left > 1 ? 's' : ''} left.` : 'Wrong code. Click "Send a new code".');
  }

  user.emailVerified = true;
  user.emailOtp = undefined;
  await user.save();
  return json({ ok: true });
});
