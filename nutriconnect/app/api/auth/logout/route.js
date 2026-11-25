// Logging out just forgets the token in that browser tab; nothing to clear on the server.
export async function POST() {
  return Response.json({ ok: true });
}
