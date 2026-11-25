import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Package } from '@/lib/models';
import { validPrice, MIN_PRICE, MAX_PRICE } from '@/lib/pricing';

async function own(user, id) {
  const pkg = await Package.findOne({ _id: id, provider: user._id });
  if (!pkg) throw new HttpError(404, 'Package not found.');
  return pkg;
}

export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(['provider']);
  const pkg = await own(user, params.id);
  const b = await readBody(req);
  for (const f of ['title', 'description']) if (b[f] !== undefined) pkg[f] = b[f];
  if (b.price !== undefined && !validPrice(b.price)) throw new HttpError(400, `Price must be between ₹${MIN_PRICE} and ₹${MAX_PRICE} per hour.`);
  if (b.active && !validPrice(b.price ?? pkg.price)) throw new HttpError(400, `Set a price between ₹${MIN_PRICE} and ₹${MAX_PRICE} before showing this package.`);
  for (const f of ['durationWeeks', 'price']) if (b[f] !== undefined) pkg[f] = Number(b[f]);
  pkg.sessions = 1;
  if (b.features !== undefined) {
    pkg.features = (Array.isArray(b.features) ? b.features : String(b.features).split('\n')).map((s) => s.trim()).filter(Boolean);
  }
  if (b.active !== undefined) pkg.active = Boolean(b.active);
  await pkg.save();
  return json({ package: pkg });
});

export const DELETE = handler(async (req, { params }) => {
  const user = await requireUser(['provider']);
  const pkg = await own(user, params.id);
  // Keep history intact: deactivate instead of hard delete
  pkg.active = false;
  await pkg.save();
  return json({ ok: true });
});
