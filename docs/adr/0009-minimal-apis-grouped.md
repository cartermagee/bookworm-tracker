# ADR-0009: Minimal APIs Grouped by Feature with Static Handlers

**Status:** Accepted
**Date:** 2026-05-19

## Context

ASP.NET Core offers two endpoint paradigms:

- **MVC Controllers:** `[ApiController]` + `ControllerBase`, attribute routing, `BooksController.cs` per resource. The default since 2016.
- **Minimal APIs flat:** `app.MapGet("/api/books", ...)` directly in `Program.cs`. New since .NET 6.
- **Minimal APIs grouped by feature:** `app.MapGroup("/api/books").MapBookEndpoints()` with a static class per feature owning its endpoint registrations.

Minimal APIs have measurably lower request overhead than MVC and are Microsoft's stated direction. The grouped pattern emerged as the community standard for organizing them at non-trivial scale.

## Decision

Minimal APIs grouped by feature. Each feature folder owns an `<Feature>Endpoints.cs` with a static extension method (e.g., `MapBookEndpoints(this WebApplication app)`) that creates a `RouteGroupBuilder` and registers handlers. Handlers are `static` methods on the same class, returning `TypedResults`.

## Consequences

- `RequireAuthorization()` is applied once at the group level. Forgetting auth on a new endpoint added to the group is impossible — a major class of security bug eliminated by structure.
- Routes are colocated with feature code; `Program.cs` stays short and shows the overall API shape at a glance.
- Static handlers with DI parameters are testable and have no implicit state. Instance methods on a class would imply state and invite misuse.
- `TypedResults` produces accurate OpenAPI metadata automatically, enabling reliable TypeScript type generation on the frontend.
- Controllers were rejected as the legacy idiom: they still work but are not where current .NET is heading, and they encourage "fat controller" anti-patterns at scale.
