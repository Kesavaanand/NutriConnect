import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { Package } from '@/lib/models';
import { validPrice, MIN_PRICE, MAX_PRICE } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await requireUser(['provider']);
  const packages = await Package.find({ provider: user._id }).sort({ createdAt: -1 }).lean();
  return json({ packages });
});

export const POST = handler(async (req) => {
  const user = await requireUser(['provider']);
  const b = await readBody(req);
  if (!b.title || b.price === undefined) throw new HttpError(400, 'Title and price are required.');
  if (!validPrice(b.price)) throw new HttpError(400, `Price must be between ₹${MIN_PRICE} and ₹${MAX_PRICE} per hour.`);
  const pkg = await Package.create({
    provider: user._id,
    title: b.title,
    description: b.description,
    durationWeeks: Number(b.durationWeeks) || 4,
    sessions: 1, // every booking is one 1-hour live session
    price: Number(b.price),
    features: (Array.isArray(b.features) ? b.features : String(b.features || '').split('\n')).map((s) => s.trim()).filter(Boolean),
    active: b.active !== false,
  });
  return json({ package: pkg }, 201);
});
