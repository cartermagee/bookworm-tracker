# ADR-0012: No API Versioning

**Status:** Accepted
**Date:** 2026-05-19

## Context

API versioning solves a specific problem: maintaining backward compatibility for external consumers a server cannot deploy in lockstep with. Common approaches:

- **No versioning:** Endpoints are `/api/<resource>`. Breaking changes are breaking changes.
- **URL versioning:** `/api/v1/<resource>`. Visible, greppable, browser-testable.
- **Header versioning:** `Api-Version: 1.0` header on requests. Cleaner URLs; harder to debug.

This API has exactly one consumer: the Next.js frontend in the same repository, deployed in lockstep, with TypeScript types generated from the OpenAPI spec at build time. The compiler enforces the contract.

## Decision

No versioning. No `/v1/` URL segment. No `Api-Version` header. No `Microsoft.AspNetCore.Mvc.Versioning` package.

## Consequences

- URLs stay short and direct.
- The "what does v2 mean? what's our deprecation policy?" questions are deferred until they have answers.
- Breaking API changes will break the frontend build immediately — the desired behavior in development, since it surfaces drift between the two sides.
- If this API is ever exposed externally, adding versioning is a 30-minute refactor (find-replace `/api/` → `/api/v1/`, register `AddApiVersioning()`) inside the much larger work of "make this a public API" (docs, rate limiting, auth scheme, SLA). Versioning is not the gating concern.
- The README contains a `## Future: Public API` stub naming what would change.
