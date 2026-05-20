# Architecture

> **Status:** Phase 1 stub. Phase 4 fills in the layering, data-flow, auth-flow, and OpenAPI-contract sections based on the real built code.

## TODO (Phase 4)

- Layering: why three projects, what each owns, the inward-pointing reference arrows.
- Data flow: request → endpoint group → handler → DbContext → SQLite (and the OpenLibrary client subpath).
- Auth flow: register → login → httpOnly cookie → middleware → handler. Diagram the cookie's lifetime.
- Why no User entity in `Core`: ASP.NET Core Identity owns the user schema. See [ADR-0006](adr/0006-httponly-cookie-auth.md) and §2.10 of the master prompt.
- OpenAPI contract: how `openapi.json` is generated, committed, and regenerated. CI freshness check.
