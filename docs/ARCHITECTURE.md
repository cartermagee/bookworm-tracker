# Architecture

Bookworm Tracker is a personal book library and reading tracker. The backend is a .NET 10 Minimal API that exposes a JSON/REST API over HTTP; the frontend is a Next.js 15 App Router single-page application that consumes it. They share a contract expressed as a committed OpenAPI spec and generated TypeScript types.

## Project layout

```
bookworm-tracker/
├── backend/
│   ├── BookTracker.Api/          # HTTP layer: endpoints, auth, DI wiring, Swashbuckle
│   ├── BookTracker.Core/         # Domain: Book entity, BookStatus enum, IBookMetadataService interface
│   ├── BookTracker.Infrastructure/  # EF Core DbContext, migrations, OpenLibraryClient
│   └── BookTracker.Tests/        # Integration + unit tests
├── frontend/
│   ├── src/app/                  # Next.js App Router pages (login, register, library/*)
│   ├── src/components/           # Reusable UI components (BookCard, BookForm, BookList, OpenLibrarySearch)
│   └── src/lib/api/              # Generated types.ts, typed fetch client, TanStack Query hooks
└── docs/
    ├── adr/                      # 16 Architecture Decision Records
    ├── ARCHITECTURE.md           # This file
    ├── RUNBOOK.md
    └── TESTING.md
```

## Backend layering

Three projects with inward-pointing references — outer layers know about inner ones, never the reverse:

```
BookTracker.Api  ──refs──▶  BookTracker.Infrastructure  ──refs──▶  BookTracker.Core
       │                                                                    ▲
       └───────────────────────────refs────────────────────────────────────┘
BookTracker.Tests ──refs──▶  BookTracker.Api (for WebApplicationFactory<Program>)
```

**`BookTracker.Core`** has no framework references. It defines:
- `Book` — the aggregate root. Carries `UserId` (FK to ASP.NET Identity's `AspNetUsers.Id`) for multi-tenancy enforcement.
- `BookStatus` — `WantToRead | Reading | Read`, serialized on the wire as camelCase strings.
- `IBookMetadataService` — the interface the Open Library integration satisfies.

**`BookTracker.Infrastructure`** references Core and EF Core. It defines:
- `AppDbContext` — a single `DbContext` that doubles as the Identity store (`IdentityDbContext<IdentityUser>`). One context, one SQLite file, one connection string. See [ADR-0003](adr/0003-sqlite-via-ef-core.md).
- `BookConfiguration` — EF Core fluent config: `BookStatus` stored as string, index on `UserId` for tenancy queries.
- `OpenLibraryClient` — typed `HttpClient` implementation of `IBookMetadataService`. Hits `openlibrary.org/search.json`.

**`BookTracker.Api`** references both. It defines:
- Endpoint groups: `MapAuthEndpoints`, `MapBookEndpoints`, `MapOpenLibraryEndpoints`, `MapHealthEndpoints`.
- Infrastructure: `JwtTokenService`, `CookieJwtBearerEvents`, `ValidationFilter<T>`, `ProblemDetailsConfiguration`, `RateLimitingConfiguration`.
- Swashbuckle schema filters for correctness (see [OpenAPI contract](#openapi-contract) below).
- `Program.cs` — the composition root. All services are registered here and the middleware pipeline is built explicitly in order.

## Middleware pipeline order

```
ExceptionHandler  →  StatusCodePages  →  CORS  →  RateLimiter  →  Authentication  →  Authorization  →  Endpoints
```

Order matters: CORS runs before auth so browsers get proper preflight responses on 401s. The rate limiter runs after CORS so cross-origin requests are subject to the same limits. Authentication and Authorization run last so endpoints can safely call `RequireAuthorization()`.

## Auth flow

Registration and login share the same cookie-issuance path:

```
POST /api/auth/register  (or /login)
  │
  ├─ FluentValidation (via ValidationFilter<T>) — sync, before the handler
  ├─ Rate limiter — 5 requests/min/IP (sliding window)
  │
  ▼
AuthEndpoints handler
  ├─ UserManager.CreateAsync / CheckPasswordSignInAsync
  ├─ JwtTokenService.Create(user)
  │    └─ Builds HS256 JWT: sub=userId, email, iss, aud, exp=+1h
  └─ Response.Cookies.Append("authToken", token, HttpOnly=true, SameSite=Lax,
                              Secure=false in dev / true in prod, Expires=+1h)
```

Subsequent authenticated requests:

```
Request arrives with Cookie: authToken=<jwt>
  │
  └─ CookieJwtBearerEvents.OnMessageReceived
       └─ context.Token = request.Cookies["authToken"]
           │
           └─ Standard JwtBearer validation (issuer, audience, lifetime, signature)
               │
               └─ ClaimsPrincipal populated → handler receives authenticated user
```

`POST /api/auth/logout` deletes the cookie with `Response.Cookies.Delete("authToken")`.

See [ADR-0006](adr/0006-httponly-cookie-auth.md) for why httpOnly cookie rather than `Authorization: Bearer` header.

## Multi-tenancy

Every `Book` row carries a `UserId` string (FK to `AspNetUsers.Id`). Every query in `BookEndpoints` begins with a `Where(b => b.UserId == currentUserId)` clause, where `currentUserId` is extracted from `ClaimTypes.NameIdentifier` on the authenticated `ClaimsPrincipal`.

There is no middleware or global filter enforcing this — it is a per-handler responsibility, enforced by the `MultiTenancyTests` integration test that was written in Phase 1 and must stay green. If you add a new book endpoint, add a corresponding tenancy test.

## Data flow: typical book request

```
GET /api/books  (Cookie: authToken=<jwt>)
  │
  ├─ CookieJwtBearerEvents lifts JWT from cookie
  ├─ JwtBearer validates token → ClaimsPrincipal
  ├─ RequireAuthorization() gate passes
  │
  └─ BookEndpoints.List handler
       ├─ Extracts userId from ClaimsPrincipal.FindFirstValue(NameIdentifier)
       ├─ AppDbContext.Books.Where(b => b.UserId == userId)
       │                    .OrderByDescending(b => b.DateAdded)
       │                    .ToListAsync()
       ├─ Maps each Book → BookDto
       └─ Returns 200 Ok<List<BookDto>>
```

## Data flow: Open Library search

```
GET /api/open-library/search?q=dune  (Cookie: authToken=<jwt>)
  │
  └─ OpenLibraryEndpoints handler
       └─ IBookMetadataService (resolved as OpenLibraryClient)
            └─ HttpClient GET https://openlibrary.org/search.json?q=dune&limit=10
                 ├─ Polly StandardResilienceHandler (retry + circuit breaker)
                 ├─ Maps JSON response → OpenLibrarySearchResult[]
                 └─ Returns 200 Ok<List<OpenLibrarySearchResult>>
```

## OpenAPI contract

The contract is the source of truth shared between the backend and frontend. Neither side may drift from it without an immediate, visible failure.

**Generation:**

```
dotnet run --project backend/BookTracker.Api
  └─ Swashbuckle generates /swagger/v1/swagger.json at runtime
       ├─ RequireNonNullablePropertiesSchemaFilter: adds non-nullable props to required[]
       └─ CamelCaseStringEnumSchemaFilter: emits "wantToRead" not 0

pnpm gen:types  (inside frontend/)
  └─ Fetches http://localhost:5000/swagger/v1/swagger.json → frontend/openapi.json
       └─ openapi-typescript → src/lib/api/types.ts
```

**Enforcement:** The `openapi-freshness` CI job boots the backend, re-fetches the spec, re-runs `gen:types`, and fails if `openapi.json` or `types.ts` would change. This means any backend change that alters the API shape must be accompanied by regenerated types in the same commit.

**Frontend consumption:** `src/lib/api/client.ts` is a hand-written typed fetch client. `src/lib/api/queries.ts` wraps each call in a TanStack Query `useQuery` or `useMutation`. All types flow from the generated `types.ts`:

```ts
import type { components } from "@/lib/api/types";
type BookDto = components["schemas"]["BookDto"];
```

## Error shape

Every error response is `application/problem+json` (RFC 7807). The `GlobalExceptionHandler` catches unhandled exceptions; `UseStatusCodePages()` converts bare 401/404 status codes into ProblemDetails. All endpoint handlers return typed `ProblemHttpResult` on validation and business-rule failures. See [ADR-0010](adr/0010-problemdetails-errors.md).

In development, the `detail` field of a 500 response contains the exception message. In production it is suppressed.

## Key decisions

Every locked decision has an ADR in `docs/adr/`. The most consequential ones for day-to-day work:

| ADR | Decision |
|-----|----------|
| [0002](adr/0002-three-project-backend.md) | Three-project backend (Api / Core / Infrastructure) |
| [0003](adr/0003-sqlite-via-ef-core.md) | SQLite via EF Core; one `AppDbContext` |
| [0005](adr/0005-local-first-data-model.md) | Book data lives locally; Open Library is a search-only source |
| [0006](adr/0006-httponly-cookie-auth.md) | JWT in httpOnly cookie, not Authorization header |
| [0009](adr/0009-minimal-apis-grouped.md) | Minimal APIs with endpoint groups, not MVC controllers |
| [0016](adr/0016-net10-bump.md) | Target framework bumped from net9.0 to net10.0 |
