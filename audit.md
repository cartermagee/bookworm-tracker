# Bookworm Tracker — Codebase Audit

**Date:** 2026-05-27  
**Tools:** [Fallow](https://fallow.tools) (frontend) · Manual static analysis (backend)  
**Frontend health score: 57 / C**

---

## Frontend (Fallow)

### Dead Code

**Unused exports (6)**

| File | Symbol |
|------|--------|
| `src/lib/api/client.ts` | `API_BASE_URL`, `apiFetch` |
| `src/lib/api/queries.ts` | `queryKeys`, `useMe` |
| `src/components/ui/card.tsx` | `CardFooter` |
| `src/lib/validation/book.ts` | `updateBookSchema` |

**Unused type exports (4)**

| File | Symbol |
|------|--------|
| `src/components/ui/button.tsx` | `ButtonProps` |
| `src/components/ui/input.tsx` | `InputProps` |
| `src/components/ui/label.tsx` | `LabelProps` |
| `src/lib/validation/book.ts` | `UpdateBookInput` |

`updateBookSchema` and `UpdateBookInput` in `book.ts` are the most significant — they suggest a client-side update validation path was sketched but never wired up. Either hook them into `BookForm` or delete them.

Run `npx fallow fix --dry-run` to preview auto-fixes for the safe ones.

---

### Unused Dependencies

| Package | Type | Action |
|---------|------|--------|
| `next-themes` | `dependencies` | Remove — never imported anywhere |
| `lucide-react` | `dependencies` | Remove — never imported anywhere |
| `eslint-config-next` | `devDependencies` | Remove — never referenced |

These three are costing the health score 25 points and adding install weight for nothing.

---

### Code Duplication — 281 lines (10.3%)

**1. Login / Register pages (60 lines, 2 clone groups)**  
`src/app/login/page.tsx:26-80` ↔ `src/app/register/page.tsx:26-80`  
Both pages share the same email/password form structure, error state handling, and redirect logic. Extract into an `<AuthForm>` component that accepts `mode="login" | "register"` and a submit handler.

**2. `src/lib/api/types.ts` (87 lines, 4 clone groups)**  
The generated OpenAPI types have repeated structural patterns (lines 7-97 and 114-309). This is largely inherent to the generated file, but the health tip applies: add `__generated__` or `types.ts` to `health.ignore` in a `fallow.config.json` so it doesn't skew the duplication score.

**3. E2E test setup (3 clone groups across auth/books/protected-routes specs)**  
The login helper block appears nearly verbatim in all three spec files. Extract to a shared `tests/e2e/helpers/auth.ts` fixture.

---

### Complexity — 8 Functions Above Threshold

| Function | File | Cyclomatic | Cognitive | CRAP | Lines |
|----------|------|-----------|-----------|------|-------|
| `BookDetailPage` | `library/[id]/page.tsx` | 24 | 26 | **600** | 240 |
| `BookForm` | `BookForm.tsx` | 16 | 14 | **272** | 195 |
| `OpenLibrarySearch` | `OpenLibrarySearch.tsx` | 10 | 5 | **110** | 116 |
| `LibraryPage` | `library/page.tsx` | 10 | 8 | **110** | 122 |
| `onSubmit` | `library/[id]/page.tsx` | 8 | 7 | 72 | 19 |
| `LoginPage` | `login/page.tsx` | 8 | 7 | 72 | 111 |
| `RegisterPage` | `register/page.tsx` | 8 | 7 | 72 | 111 |
| `onSubmit` | `library/new/page.tsx` | 8 | 7 | 72 | 18 |

**`BookDetailPage` is the highest-priority refactor** (CRAP 600 means it is both very complex and has no test coverage). At 240 lines it's doing book fetching, form state, edit/delete mutations, optimistic UI, and rendering in one component. Recommended split:

- `<BookDetail>` — read-only display
- `<BookEditForm>` — edit form + submit (reuses `BookForm`)
- `<BookActions>` — delete button + confirmation dialog
- A `useBookDetail(id)` hook for the data-fetching/mutation logic

`BookForm` (CRAP 272) should also extract its `onSubmit` logic into a custom hook.

---

## Backend (Static Analysis)

### Bug: `UpdateBookRequestValidator` Missing `Status` Enum Check

`CreateBookRequestValidator` has:
```csharp
RuleFor(x => x.Status).IsInEnum();
```

`UpdateBookRequestValidator` does **not**. An `Update` request with an out-of-range integer status will pass validation and write a bad value to the database. Add the missing rule:

```csharp
RuleFor(x => x.Status).IsInEnum();
```

---

### Security: No Account Lockout on Failed Logins

`AuthEndpoints.Login` calls:
```csharp
await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
```

The rate limiter (5 req/min/IP) provides some protection, but changing `lockoutOnFailure: true` is the correct defence-in-depth fix. It requires adding a `DefaultLockout` policy to the Identity options in `Program.cs`:

```csharp
.AddIdentityCore<IdentityUser>(o =>
{
    // existing password options ...
    o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    o.Lockout.MaxFailedAccessAttempts = 10;
})
```

---

### Security: No Token Refresh Endpoint

JWTs expire after 1 hour (default) with no refresh path. When a token expires the frontend gets a silent 401. Add a `POST /api/auth/refresh` endpoint that validates the current (non-expired-claims-wise) cookie and issues a new one, or extend the cookie expiry on every successful authenticated request.

---

### Code Smell: Silent `catch` in `OpenLibraryClient`

`GetByWorkIdAsync` and `GetAuthorNameAsync` both swallow exceptions without logging:

```csharp
catch (Exception)
{
    // Editions fetch failure is non-fatal — return what we have
}
```

The best-effort intent is correct, but a silent swallow makes it invisible in production. Inject `ILogger<OpenLibraryClient>` and log at Warning level:

```csharp
catch (Exception ex)
{
    _logger.LogWarning(ex, "Failed to fetch editions for work {WorkId}; returning partial metadata", workId);
}
```

---

### Code Smell: `CreateBookRequest` and `UpdateBookRequest` Are Identical

Both records have the exact same 9 fields. The comment says they're separate for schema/validator independence, but the validators themselves are now nearly identical and have drifted (see the bug above). Consider a shared abstract validator base or at minimum a test that asserts both validators cover the same rules.

---

### Architecture: Inline Types in `Program.cs`

`GlobalExceptionHandler`, `RequireNonNullablePropertiesSchemaFilter`, and `CamelCaseStringEnumSchemaFilter` are all defined at the bottom of `Program.cs`. They belong in their own files:

- `Infrastructure/Exceptions/GlobalExceptionHandler.cs`
- `Infrastructure/OpenApi/RequireNonNullablePropertiesSchemaFilter.cs`
- `Infrastructure/OpenApi/CamelCaseStringEnumSchemaFilter.cs`

---

### Minor: `OpenLibraryEndpoints.Search` Has No Rate Limit

The `/api/open-library/search` endpoint proxies to the Open Library API with no client-side rate limiting. A single authenticated user could hammer it and exhaust Open Library's rate allowance or inflate your HTTP client metrics. Apply the same `RateLimitingConfiguration.AuthPolicy` used on auth endpoints, or create a separate, looser policy.

---

### Minor: `Book` Entity Not Sealed

`BookTracker.Core.Entities.Book` is a leaf entity that will never be subclassed. Mark it `sealed` for clarity and minor JIT benefits.

---

### Dependencies

All `.NET` packages are on `10.0.0` (Microsoft stack) — current and consistent. `FluentAssertions` is on `6.12.2` (v6 line); v7 is out with a stricter assertion API but v6 is still maintained — no action required unless you want the upgrade.

No known CVEs detected in the package set.

---

## Priority Summary

| Priority | Item | Side |
|----------|------|------|
| 🔴 High | `Status` enum validation missing in `UpdateBookRequestValidator` — data integrity bug | Backend |
| 🔴 High | Remove `next-themes`, `lucide-react`, `eslint-config-next` — dead weight | Frontend |
| 🔴 High | `BookDetailPage` (CRAP 600) — split into focused components + hook | Frontend |
| 🟠 Medium | `lockoutOnFailure: false` — enable account lockout | Backend |
| 🟠 Medium | Login/Register duplication — extract `<AuthForm>` | Frontend |
| 🟠 Medium | Add logging to silent `catch` blocks in `OpenLibraryClient` | Backend |
| 🟠 Medium | `BookForm` (CRAP 272) — extract `onSubmit` to hook | Frontend |
| 🟡 Low | Extract inline types out of `Program.cs` | Backend |
| 🟡 Low | Add rate limit to `/api/open-library/search` | Backend |
| 🟡 Low | E2E test fixture duplication — extract login helper | Frontend |
| 🟡 Low | `Book` entity: add `sealed` | Backend |
| 🟡 Low | No token refresh endpoint | Backend |
