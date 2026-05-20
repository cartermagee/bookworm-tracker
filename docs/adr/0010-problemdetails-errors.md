# ADR-0010: ProblemDetails (RFC 7807) for All Error Responses

**Status:** Accepted
**Date:** 2026-05-19

## Context

Error response shape options:

- **Ad-hoc:** Per-endpoint strings or objects. Pushes parsing complexity to every client call site.
- **ProblemDetails (RFC 7807 / RFC 9457):** Standardized JSON shape with `type`, `title`, `status`, `detail`, `instance`. First-class support in .NET via `Results.Problem()`, `TypedResults.Problem()`, `AddProblemDetails()`.
- **Custom error envelope:** `{ error: { code, message, details } }`. Gives stable error codes but creates a non-standard shape every client must learn.

Stable error codes (e.g., `BOOK_NOT_FOUND`, `EMAIL_TAKEN`) are genuinely useful for client logic; the question is whether they need a custom envelope to express.

## Decision

ProblemDetails for all non-success responses. Stable error codes are added via the `extensions` dictionary: `problemDetails.Extensions["errorCode"] = "BOOK_NOT_FOUND"`. ValidationProblemDetails (the RFC's extension for validation errors) is used automatically by FluentValidation's endpoint filter.

## Consequences

- Standard shape works with any HTTP client, including the OpenAPI-generated TypeScript types.
- Stable error codes for client logic are preserved without abandoning the standard.
- Global exception handler converts unhandled exceptions to 500 ProblemDetails. **In production, the `detail` field never contains `ex.Message` or stack traces** — non-negotiable. In development it may, gated on `IHostEnvironment.IsDevelopment()`.
- `traceId` extension added to every ProblemDetails response for correlation with logs.
- 401 responses from auth middleware are also ProblemDetails (requires explicit configuration; bare 401s are a common oversight).
