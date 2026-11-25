import { handler, json, readBody } from '@/lib/api';
import { User } from '@/lib/models';
import { sendEmail, resetEmail, emailConfigured } from '@/lib/email';
import { hashValue, newResetToken, siteUrl, RESET_TTL_MS, RESEND_WAIT_MS } from '@/lib/otp';

// Emails a one-time reset link. Always answers the same way, so nobody can test which emails are registered.
export const POST = handler(async (req) => {
  const { email } = await readBody(req);
  const clean = String(email || '').toLowerCase().trim();
  const reply = { ok: true, message: 'If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).', emailConfigured: emailConfigured() };
  const user = await User.findOne({ email: clean });
  if (!user || (user.role === 'provider' && user.status === 'terminated')) return json(reply);

  const last = user.resetToken?.sentAt ? new Date(user.resetToken.sentAt).getTime() : 0;
  if (Date.now() - last < RESEND_WAIT_MS) return json(reply); // quietly limit to one email per minute

  const token = newResetToken();
  user.resetToken = { hash: hashValue(`${user._id}:${token}`), expiresAt: new Date(Date.now() + RESET_TTL_MS), sentAt: new Date() };
  await user.save();
  const link = `${siteUrl(req)}/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`;
  await sendEmail({ to: user.email, toName: user.name, ...resetEmail(user.firstName || user.name, link) });
  return json(reply);
});
