import bcrypt from 'bcryptjs';
import { handler, json, readBody, HttpError, normalizePhone } from '@/lib/api';
import { User, ProviderProfile } from '@/lib/models';
import { sendVerificationCode } from '@/lib/verification';

// Step 1 of sign-up: create the account (unverified) and email a 6-digit code.
// The user must enter the code on /verify-email before they can log in.
export const POST = handler(async (req) => {
  const { firstName, lastName, email, password, phone, role, providerType } = await readBody(req);
  const first = String(firstName || '').trim();
  const last = String(lastName || '').trim();
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!first || !last) throw new HttpError(400, 'Please enter your first name and last name.');
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new HttpError(400, 'Please enter a valid email address.');
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) throw new HttpError(400, 'Please enter a valid phone number (10 digits, e.g. 9876543210).');
  if (!password || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  const safeRole = role === 'provider' ? 'provider' : 'client'; // admins can never sign up

  let user = await User.findOne({ email: cleanEmail });
  if (user && user.emailVerified !== false) {
    throw new HttpError(409, 'An account with this email already exists. Try logging in.');
  }

  const fields = {
    firstName: first,
    lastName: last,
    name: `${first} ${last}`,
    email: cleanEmail,
    phone: cleanPhone,
    password: await bcrypt.hash(password, 10),
    role: safeRole,
    status: safeRole === 'provider' ? 'pending' : 'active',
    statusHistory: safeRole === 'provider' ? [{ status: 'pending', reason: 'Signed up', by: 'system' }] : [],
    emailVerified: false,
  };

  if (user) {
    // Signed up before but never verified: update the details and send a new code
    user.set(fields);
    await user.save();
  } else {
    user = await User.create(fields);
  }
  if (safeRole === 'provider' && !(await ProviderProfile.exists({ user: user._id }))) {
    await ProviderProfile.create({ user: user._id, providerType: providerType === 'Nutritionist' ? 'Nutritionist' : 'Dietician' });
  }

  const sent = await sendVerificationCode(user, { force: true });
  return json({ needsVerification: true, email: user.email, emailConfigured: sent.emailConfigured }, 201);
});
