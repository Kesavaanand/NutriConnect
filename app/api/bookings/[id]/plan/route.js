import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { getBookingFor, sessionActive } from '@/lib/bookings';

// Dietician writes / updates the diet prescription — only after the live chat has happened
export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(['provider']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  if (!['accepted', 'completed'].includes(booking.status)) {
    throw new HttpError(400, 'Accept the booking before writing a prescription.');
  }
  if (!(booking.session?.used > 0) || sessionActive(booking)) {
    throw new HttpError(400, 'Finish the live chat session first. The prescription unlocks after the chat ends.');
  }
  const b = await readBody(req);
  const meals = (Array.isArray(b.meals) ? b.meals : [])
    .filter((m) => m && String(m.items || '').trim()) // ignore empty meal rows
    .slice(0, 12)
    .map((m) => ({ time: String(m.time || ''), name: String(m.name || ''), items: String(m.items || '').slice(0, 1000) }));

  const text = (v) => String(v || '').slice(0, 3000);
  if (!meals.length && !text(b.include).trim() && !text(b.avoid).trim() && !text(b.overview).trim()) {
    throw new HttpError(400, 'Please fill at least the foods to intake/avoid or the meal plan.');
  }
  booking.dietPlan = {
    title: b.title || 'Diet prescription',
    overview: b.overview || '',
    dailyCalories: Number(b.dailyCalories) || undefined,
    meals,
    include: text(b.include),
    avoid: text(b.avoid),
    guidelines: text(b.guidelines),
    updatedAt: new Date(),
  };
  await booking.save();
  return json({ dietPlan: booking.dietPlan });
});
