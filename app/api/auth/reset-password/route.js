import bcrypt from 'bcryptjs';
import { handler, json, readBody, HttpError } from '@/lib/api';
import { User } from '@/lib/models';
import { hashValue, safeEqual } from '@/lib/otp';

// Sets a new password using the link from the email (valid 30 minutes, works once)
export const POST = handler(async (req) => {
  const { email, token, password } = await readBody(req);
  if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  const rt = user?.resetToken || {};
  const valid = user && rt.hash && rt.expiresAt && new Date(rt.expiresAt) > new Date() && safeEqual(hashValue(`${user._id}:${token}`), rt.hash);
  if (!valid) throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.');

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.emailVerified = true; // they proved they own the email
  user.emailOtp = undefined;
  await user.save();
  return json({ ok: true });
});
