import bcrypt from 'bcryptjs';
import { handler, json, readBody, HttpError, issueToken, publicUser } from '@/lib/api';
import { User } from '@/lib/models';

export const POST = handler(async (req) => {
  const { email, password } = await readBody(req);
  if (!email || !password) throw new HttpError(400, 'Please enter your email and password.');
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user && !user.password && user.googleId) {
    throw new HttpError(400, 'This account was created with Google. Please use "Continue with Google".');
  }
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Incorrect email or password.');
  }
  if (user.emailVerified === false) {
    return json({ error: 'Please verify your email first. We sent a 6-digit code to your inbox.', code: 'EMAIL_NOT_VERIFIED', email: user.email }, 403);
  }
  if (user.role === 'provider' && user.status === 'terminated') {
    throw new HttpError(403, 'This account has been terminated by the administrator.' +
      (user.statusReason ? ` Reason: ${user.statusReason}` : ''));
  }
  const token = await issueToken(user);
  return json({ user: publicUser(user), token });
});
