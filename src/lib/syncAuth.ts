/** Machine-to-machine auth for /api/sync/* routes — checked against a shared secret, not a user login. */
export function checkSyncAuth(req: Request): Response | null {
  const expected = process.env.SYNC_API_KEY;
  if (!expected) {
    return new Response("A sincronização automática ainda não está configurada neste ambiente (falta SYNC_API_KEY).", {
      status: 503,
    });
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (token !== expected) {
    return new Response("Não autorizado.", { status: 401 });
  }

  return null;
}
