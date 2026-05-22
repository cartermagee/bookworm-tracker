# Testing

## Philosophy: integration-first (B+)

The goal is a test suite where every test is load-bearing — if it fails, something behaviorally important broke. The target grade is B+, not A+: we're not aiming for complete coverage, we're aiming for the right coverage.

The deciding question for any test: **"Would this test failing tell me something I didn't already know from the code?"** If no, skip it.

Thin layers — DTO mappers, trivial property assignments, simple pass-through wrappers — are not tested. Implementation details that can change without behavioral impact are not tested. What gets tested: the real HTTP surface of the API, the external service client, validation rules, and the flows a real user would exercise.

See [ADR-0007](adr/0007-integration-first-testing.md) for the full rationale.

---

## Test inventory (31 tests)

### `Auth/AuthEndpointTests.cs` — smoke tests for auth endpoints

Uses `WebApplicationFactory<Program>` with a real in-memory SQLite database. Tests the four auth endpoints (`/register`, `/login`, `/logout`, `/me`) for expected status codes and cookie behavior. One test per meaningful path (success, duplicate email, wrong password, unauthenticated access).

### `Books/BookEndpointsTests.cs` — endpoint integration tests (10 tests)

Each test gets its own `ApiFactory` instance to avoid rate-limiter exhaustion across tests. Covers the full CRUD surface against a real database:

- `List` — returns empty array for new user, returns books after creation
- `Create` — round-trips all fields, returns 201 with `Location` header
- `GetById` — 200 with correct fields, 404 for missing ID
- `Update` — persists changes, re-fetches to confirm
- `Delete` — 204 on success, 404 after deletion

### `Books/MultiTenancyTests.cs` — the most important test

Written in Phase 1 (skipped until Phase 2 made it pass). Registers two users, creates books under each, then asserts that neither user can see, modify, or delete the other's books. Tests all five endpoints (List, GetById, Update, Delete) for cross-user isolation.

If this test is green, the multi-tenancy implementation is correct. If this test is red, data is leaking between users and the API must not be deployed.

### `OpenLibrary/OpenLibraryClientTests.cs` — unit tests (4 tests)

Tests `OpenLibraryClient` directly with a `FakeHttpMessageHandler` that returns canned JSON responses. No real network calls. Covers: successful search with cover URL, successful search without cover URL, empty result set, HTTP error response.

### `Validators/CreateBookRequestValidatorTests.cs` — unit tests (8 tests)

Tests `CreateBookRequestValidator` in isolation via `FluentValidation.TestHelper`. Covers required-field validation, length limits, enum membership for `Status`, URL format for `CoverUrl`, and the cross-field rule (dateFinished required iff status is Read). The validator is instantiated with the same camelCase `PropertyNameResolver` used in `Program.cs` so error paths match the wire format.

### `Fixtures/ApiFactory.cs` and `TestHelpers.cs`

`ApiFactory` is a thin wrapper around `WebApplicationFactory<Program>` that overrides the SQLite connection to a per-test in-memory database. Each test that needs isolation creates its own instance.

`TestHelpers.CreateBook` registers a user, logs in (extracting the auth cookie), and posts a book in one call. Used by most book endpoint tests to set up state.

---

## E2E tests (Playwright)

Located in `frontend/tests/e2e/`. Three spec files:

- `auth.spec.ts` — register, login, logout flows; redirect behavior for unauthenticated access
- `protected-routes.spec.ts` — unauthenticated requests to `/library` redirect to `/login`
- `books.spec.ts` — add a book manually, verify it appears in the library, navigate to the detail page

Playwright uses `webServer` in `playwright.config.ts` to start both the backend and the Next.js dev server before the suite runs. In CI the backend is pre-built (`dotnet build`) so startup is fast.

Run locally:

```bash
cd frontend
pnpm test:e2e        # headless (uses pre-built backend if available)
pnpm exec playwright test --headed   # headed, for debugging
pnpm exec playwright test --ui       # Playwright UI mode
```

---

## What we deliberately don't test

- **DTO mapping code** — if the mapping is wrong, the integration tests catch it at the HTTP boundary.
- **EF Core itself** — we trust the library. We test that our queries return the right data, not that EF Core can execute SQL.
- **Trivial validators** — `Title` must be non-empty is tested; every possible invalid email format is not.
- **UI component internals** — we don't snapshot-test React components. The Playwright E2E tests cover the flows that matter.
- **Happy-path-only frontend unit tests** — the cost of mocking TanStack Query and the router exceeds the signal. E2E tests cover those flows end-to-end.
