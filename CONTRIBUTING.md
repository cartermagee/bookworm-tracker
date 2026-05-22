# Contributing

## Getting started

See the [README](README.md) for prerequisites and the [RUNBOOK](docs/RUNBOOK.md) for every command you'll need. Once the stack is running:

```bash
# Backend tests pass:
cd backend && dotnet test

# Frontend typechecks and lints cleanly:
cd frontend && pnpm typecheck && pnpm lint
```

If either of those fails on a clean checkout, that's a bug — open an issue.

---

## Commits

Every commit must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Open Library search endpoint
fix: prevent duplicate book imports for the same OLID
chore: bump TanStack Query to 5.59.0
test: add tenancy isolation test for DELETE /api/books/{id}
docs: explain the cookie auth flow in ARCHITECTURE
refactor: extract JwtTokenService from AuthEndpoints
ci: cache the dotnet restore step
build: switch to TargetFramework net10.0
```

The Husky `commit-msg` hook runs `commitlint` with `@commitlint/config-conventional`. Bad messages are rejected at commit time.

To bypass hooks for a legitimate WIP commit: `git commit --no-verify`. Use sparingly; squash before merging.

---

## Code style

### Backend (C#)

- `dotnet format` enforces style automatically. It runs on staged `.cs` files via lint-staged before every commit — you rarely need to invoke it manually.
- `dotnet build -warnaserror` treats all compiler warnings as errors (configured in `Directory.Build.props`). Fix warnings; don't suppress them with `#pragma`.
- Use explicit `Results<T1, T2, ...>` typed return types on endpoint handlers rather than `IResult`. This ensures Swashbuckle can generate accurate response schemas.
- Validator classes live alongside the request they validate (`CreateBookRequest.cs` / `CreateBookRequestValidator.cs`). Register them via `AddValidatorsFromAssemblyContaining<Program>()` — no manual registration.
- Error responses must use `TypedResults.Problem(...)`, not custom JSON objects. Every error surface is `application/problem+json`.

### Frontend (TypeScript)

- ESLint flat config + Prettier run on staged files via lint-staged. `pnpm lint` runs the full check.
- TypeScript `strict: true` — no implicit `any`, no unchecked array access, no `@ts-ignore` without a comment explaining why.
- All API types flow from the generated `src/lib/api/types.ts`. Do not write types that duplicate or approximate generated ones.
- State that belongs to the server (books list, single book, current user) lives in TanStack Query. Local UI state (filter selection, sort order, form fields) lives in `useState`.
- `shadcn/ui` components in `src/components/ui/` are not modified — they are the upstream primitives. Add custom components in `src/components/` instead.

---

## Architecture Decision Records

ADRs are immutable. If a decision changes, write a new superseding ADR rather than editing the old one. See [ADR-0014](docs/adr/0014-comprehensive-docs.md) for the full policy.

Before making a non-trivial architectural change, check whether it conflicts with an existing ADR. If it does, write a new ADR first and get it reviewed before implementing.

---

## Worked example: adding a new endpoint

This walks through adding `GET /api/books/{id}/notes` — a dedicated endpoint that returns just the notes field of a book.

### 1. Backend: define the response DTO

```csharp
// BookTracker.Api/Features/Books/BookNotesDto.cs
namespace BookTracker.Api.Features.Books;

/// <summary>Notes-only view of a book.</summary>
public sealed record BookNotesDto(Guid Id, string? Notes);
```

### 2. Backend: add the handler

In `BookEndpoints.cs`, inside `MapBookEndpoints`:

```csharp
group.MapGet("/{id:guid}/notes", GetNotes);
```

And the handler:

```csharp
private static async Task<Results<Ok<BookNotesDto>, NotFound>> GetNotes(
    Guid id,
    ClaimsPrincipal user,
    AppDbContext db)
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
    var book = await db.Books
        .Where(b => b.UserId == userId && b.Id == id)
        .Select(b => new BookNotesDto(b.Id, b.Notes))
        .FirstOrDefaultAsync();
    return book is null ? TypedResults.NotFound() : TypedResults.Ok(book);
}
```

Key points:
- Always filter by `UserId` first (multi-tenancy).
- Use `Results<Ok<T>, NotFound>` — not `IResult`.
- Return `NotFound` for a book that exists but belongs to another user, same as for a book that doesn't exist. Don't leak existence.

### 3. Regenerate the OpenAPI types

```bash
# Start the backend, then:
cd frontend && pnpm gen:types
git add frontend/openapi.json frontend/src/lib/api/types.ts
```

### 4. Frontend: add the fetch function

In `src/lib/api/client.ts`:

```ts
export function apiGetBookNotes(id: string) {
  return apiFetch(`/api/books/${id}/notes`);
}
```

### 5. Frontend: add the query hook

In `src/lib/api/queries.ts`:

```ts
export function useBookNotes(id: string) {
  return useQuery<components["schemas"]["BookNotesDto"]>({
    queryKey: ["books", id, "notes"],
    queryFn: async () => {
      const r = await apiGetBookNotes(id);
      if (!r.ok) throw new Error("Failed to load notes");
      return r.json();
    },
  });
}
```

### 6. Write a test

In `BookEndpointsTests.cs`, add a test that:
- Creates a book with notes.
- Calls `GET /api/books/{id}/notes`.
- Asserts 200 and the correct `notes` value.
- Asserts 404 for a book that belongs to a different user (tenancy check).

---

## Running the full CI check locally

```bash
# Backend
cd backend
dotnet build -warnaserror
dotnet test

# Frontend
cd frontend
pnpm lint
pnpm typecheck
pnpm build

# OpenAPI freshness (requires backend running on :5000)
pnpm gen:types
git diff --exit-code -- openapi.json src/lib/api/types.ts

# E2E (requires backend and frontend running, or Playwright's webServer)
pnpm test:e2e
```
