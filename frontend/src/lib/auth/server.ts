// Server Component helper for forwarding the incoming request cookie to the .NET API.
// Reads server-only API_BASE_URL (NOT NEXT_PUBLIC_ — see locked-decision memo).
// Phase 2 wires the real `getCurrentUser()` here.

import { cookies } from "next/headers";

const SERVER_API_BASE_URL =
  process.env["API_BASE_URL"] ?? "http://localhost:5000";

export async function serverApiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  return fetch(`${SERVER_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}
