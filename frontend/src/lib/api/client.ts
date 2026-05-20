// Typed fetch wrapper for the .NET API. Phase 1 stub — Phase 2 fills out the methods.
// Reads NEXT_PUBLIC_API_BASE_URL from the environment; never reads server-only API_BASE_URL.
//
// See ADR-0006: the JWT lives in an httpOnly cookie, so we always send credentials and
// never touch a token in JS.

export const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:5000";

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}
