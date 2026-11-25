import { handler, json, readBody } from '@/lib/api';
import { User } from '@/lib/models';
import { sendVerificationCode } from '@/lib/verification';

// Send a new sign-up code (limited to once a minute)
export const POST = handler(async (req) => {
  const { email } = await readBody(req);
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user || user.emailVerified !== false) return json({ ok: true }); // don't reveal which emails exist
  const sent = await sendVerificationCode(user);
  return json({ ok: true, emailConfigured: sent.emailConfigured });
});
