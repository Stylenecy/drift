import type { NextRequest } from "next/server";
import { handlers, AUTH_ENABLED } from "@/lib/auth";

// Without Google OAuth (the hosted demo) Auth.js has no secret to run with.
// Answer the session probe with "no session" and everything else with 404,
// instead of letting it fail with a server error.
function authOff(req: NextRequest): Response {
  return req.nextUrl.pathname.endsWith("/session") ? Response.json(null) : new Response(null, { status: 404 });
}

export function GET(req: NextRequest) {
  return AUTH_ENABLED ? handlers.GET(req) : authOff(req);
}

export function POST(req: NextRequest) {
  return AUTH_ENABLED ? handlers.POST(req) : authOff(req);
}
