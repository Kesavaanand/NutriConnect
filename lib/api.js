// Server-only helpers for route handlers
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { dbConnect } from './db';
import { User } from './models';
import { signToken, verifyToken } from './auth';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (data, status = 200) => NextResponse.json(data, { status });

/**
 * Login is per browser tab: each tab keeps its own token (sessionStorage) and sends it as
 * "Authorization: Bearer <token>". That lets one tab be a client, another a dietician
 * and a third the admin at the same time.
 */
export async function getCurrentUser() {
  const auth = headers().get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.id) return null;
  await dbConnect();
  return User.findById(payload.id).select('-password');
}

/**
 * Loads the logged-in user and checks their role.
 * Providers must be "approved" unless allowUnapproved is set.
 */
export async function requireUser(roles, { allowUnapproved = false } = {}) {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  if (roles && !roles.includes(user.role)) throw new HttpError(403, 'You do not have access to this.');
  if (user.role === 'provider' && !allowUnapproved && user.status !== 'approved') {
    throw new HttpError(403, `Your account is ${user.status}. Only approved providers can do this.`);
  }
  return user;
}

/** Creates the login token that the browser tab stores and sends back. */
export const issueToken = (user) => signToken({ id: String(user._id), role: user.role, name: user.name });

export const publicUser = (u) => ({
  id: u._id, name: u.name, firstName: u.firstName, lastName: u.lastName, email: u.email,
  phone: u.phone, role: u.role, status: u.status,
});

/** Accepts Indian / international phone numbers: 10–13 digits, optional +, spaces or dashes. */
export function normalizePhone(raw = '') {
  const digits = String(raw).replace(/[\s\-()]/g, '');
  if (!/^\+?\d{10,13}$/.test(digits)) return null;
  return digits;
}

export async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function handler(fn) {
  return async (req, ctx) => {
    try {
      await dbConnect();
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      if (err?.name === 'ValidationError' || err?.name === 'CastError') {
        return json({ error: err.message }, 400);
      }
      if (err?.code === 11000) return json({ error: 'That record already exists.' }, 409);
      console.error(err);
      return json({ error: err?.message || 'Something went wrong on the server.' }, 500);
    }
  };
}
