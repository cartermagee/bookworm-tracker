# ADR-0006: JWT in httpOnly Cookie (Not Bearer Header, Not localStorage)

**Status:** Accepted
**Date:** 2026-05-19

## Context

Auth token transport choices for an SPA + API architecture:

- **JWT in `Authorization: Bearer` header, stored in `localStorage`:** What most tutorials show. Vulnerable to XSS: any script on the page can read the token.
- **JWT in `Authorization: Bearer` header, stored in memory (React state):** Lost on refresh; needs a refresh-token mechanism stored *somewhere*.
- **JWT in httpOnly cookie, set by the server:** Token unreadable from JavaScript. Sent automatically by the browser with every request to the API origin. CSRF risk mitigated by SameSite=Lax.

The frontend (Next.js App Router) needs to make authenticated requests from both Server Components (server-to-server fetch) and Client Components (browser-to-server fetch).

## Decision

JWT stored in an httpOnly, Secure, SameSite=Lax cookie at path `/`. Set by `/api/auth/login` via `Set-Cookie`; cleared by `/api/auth/logout`. The frontend never reads or writes the token directly. Server Components forward the incoming request's cookie header on outbound fetches.

## Consequences

- **XSS cannot exfiltrate the auth token.** This is the central security win and the reason for the choice.
- The frontend has no token-storage code, no refresh logic, no "where do I put this" decisions. Simpler, not more complex.
- CSRF risk exists in theory; SameSite=Lax mitigates the common cases. State-changing endpoints (POST/PUT/DELETE) cannot be triggered cross-site by a simple link. Form-based CSRF would require additional protection; we have no cross-site forms.
- Server Components must explicitly forward the cookie when calling the backend — a one-time helper in `lib/auth/server.ts`.
- CORS must be configured with `AllowCredentials()` and an explicit allowed origin. `AllowAnyOrigin()` is incompatible with credentialed requests; this is enforced as a non-negotiable.
