import { handler, json, readBody, requireUser, HttpError } from '@/lib/api';
import { getBookingFor, sessionActive } from '@/lib/bookings';
import { Message } from '@/lib/models';

// If the other side says "Not OK", the asker must wait before asking again:
// dietician 2 minutes, client 1 minute.
const BLOCK_MS = { provider: 2 * 60 * 1000, client: 60 * 1000 };
const LABEL = { provider: 'The dietician', client: 'The client' };

/**
 * End-chat handshake for a live session.
 * body.action: 'request' (ask to end) | 'respond' (+ accept: true/false) | 'cancel' (withdraw own request)
 */
export const POST = handler(async (req, { params }) => {
  const user = await requireUser(['client', 'provider']);
  const booking = await getBookingFor(user, params.id, { populate: false });
  if (!sessionActive(booking)) throw new HttpError(400, 'There is no live chat running right now.');
  const { action, accept } = await readBody(req);
  const me = user.role;
  const other = me === 'client' ? 'provider' : 'client';
  const s = booking.session;
  const now = new Date();
  const clearRequest = () => booking.set('session.endRequest', { by: null, at: null });
  const note = (text) => Message.create({ booking: booking._id, sender: user._id, senderRole: 'system', text });

  if (action === 'request') {
    if (s.endRequest?.by) {
      throw new HttpError(400, s.endRequest.by === me ? 'You already asked to end the chat. Waiting for a reply.' : `${LABEL[other]} has already asked to end the chat. Please answer that first.`);
    }
    const blocked = s.endBlockedUntil?.[me];
    if (blocked && new Date(blocked) > now) {
      const secs = Math.ceil((new Date(blocked) - now) / 1000);
      throw new HttpError(400, `${LABEL[other]} said Not OK. You can ask to end the chat again in ${secs} seconds.`);
    }
    booking.set('session.endRequest', { by: me, at: now });
    await booking.save();
    await note(`${LABEL[me]} asked to end the chat.`);
    return json({ session: booking.session, serverNow: Date.now() });
  }

  if (action === 'cancel') {
    if (s.endRequest?.by !== me) throw new HttpError(400, 'You have no pending request to end the chat.');
    clearRequest();
    await booking.save();
    await note(`${LABEL[me]} withdrew the request to end the chat.`);
    return json({ session: booking.session, serverNow: Date.now() });
  }

  if (action === 'respond') {
    if (s.endRequest?.by !== other) throw new HttpError(400, 'There is no request to answer.');
    if (accept === true) {
      // Both agreed: the session ends now
      const end = new Date(now.getTime() - 1);
      booking.set('session.activeEnd', end);
      if (s.history?.length) s.history[s.history.length - 1].end = end;
      clearRequest();
      booking.set('session.endedEarlyBy', other);
      await booking.save();
      await note(`${LABEL[me]} agreed. The chat has ended.`);
    } else {
      clearRequest();
      booking.set(`session.endBlockedUntil.${other}`, new Date(now.getTime() + BLOCK_MS[other]));
      await booking.save();
      await note(`${LABEL[me]} said Not OK — the chat continues. ${LABEL[other]} can ask again after ${BLOCK_MS[other] / 60000} minute${BLOCK_MS[other] > 60000 ? 's' : ''}.`);
    }
    return json({ session: booking.session, serverNow: Date.now() });
  }

  throw new HttpError(400, 'Unknown action.');
});
