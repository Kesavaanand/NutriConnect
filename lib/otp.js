import crypto from 'crypto';

export const OTP_TTL_MS = 10 * 60 * 1000; // code valid 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const RESEND_WAIT_MS = 60 * 1000; // wait 1 minute between emails
export const RESET_TTL_MS = 30 * 60 * 1000; // reset link valid 30 minutes

const secret = () => process.env.JWT_SECRET || 'dev-only-secret-change-me';
// Codes and tokens are stored only as hashes, never in plain text
export const hashValue = (v) => crypto.createHmac('sha256', secret()).update(String(v)).digest('hex');
export const newOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
export const newResetToken = () => crypto.randomBytes(32).toString('hex');

export function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Public address of the site, used inside email links. */
export function siteUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const h = req.headers;
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
