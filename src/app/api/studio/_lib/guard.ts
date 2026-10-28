import { notAvailable, studioEnabled } from "./files";

/**
 * Studio writes are dev-only and same-origin only. `next dev` listens on every interface
 * and a multipart POST skips the CORS preflight, so without the Origin check any page open
 * in the browser (or any host on the LAN) could write into the repo.
 */
export const rejectUnlessStudioRequest = (request: Request): Response | null => {
  if (!studioEnabled()) return notAvailable();
  // sandboxed frames send "null", which never parses
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const originHost = URL.canParse(origin ?? "") ? new URL(origin!).host : null;
  if (!originHost || originHost !== host) {
    return Response.json({ error: "Studio requests must come from the studio page" }, { status: 403 });
  }
  return null;
};
