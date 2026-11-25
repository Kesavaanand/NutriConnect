import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Package, Booking } from './models';

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (!existing) {
    await User.create({
      name: 'Administrator',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });
    console.log(`[NutriConnect] Admin account created for ${email}`);
  }
}

/**
 * Old data from before the ₹100–₹500 rule (e.g. ₹2,999 packages) is brought into range
 * automatically when the server starts, so no price above ₹500 is ever shown.
 */
async function normalizePrices() {
  const MIN = 100;
  const MAX = 500;
  const clamp = (n) => Math.min(MAX, Math.max(MIN, Number(n) || MIN));
  let fixed = 0;

  const pkgs = await Package.find({ $or: [{ price: { $gt: MAX } }, { price: { $lt: MIN } }, { sessions: { $gt: 1 } }] });
  for (const p of pkgs) {
    p.price = clamp(p.price);
    p.sessions = 1;
    await p.save();
    fixed++;
  }

  const bookings = await Booking.find({
    $or: [{ 'payment.amount': { $gt: MAX } }, { 'pricing.base': { $gt: MAX } }, { 'packageSnapshot.price': { $gt: MAX } }],
  });
  for (const b of bookings) {
    const base = clamp(b.pricing?.base ?? b.packageSnapshot?.price ?? b.payment?.amount);
    const pct = b.pricing?.discountPercent || 0;
    const discount = pct ? Math.min(Math.round((base * pct) / 100), Math.max(0, base - MIN)) : 0;
    b.pricing = { base, discountPercent: discount ? pct : 0, discount, final: base - discount };
    if (b.packageSnapshot) b.packageSnapshot.price = base;
    if (b.payment) b.payment.amount = base - discount;
    if (b.session && b.session.total > 1 && !b.session.used) b.session.total = 1;
    await b.save();
    fixed++;
  }
  if (fixed) console.log(`[NutriConnect] Brought ${fixed} old price record(s) into the ₹${MIN}–₹${MAX} range`);
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to your environment variables.');
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, { bufferCommands: false })
      .then(async (m) => {
        await ensureAdmin();
        await normalizePrices().catch((e) => console.error('Price normalisation failed', e));
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
