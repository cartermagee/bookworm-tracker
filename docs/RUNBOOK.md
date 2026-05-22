# Runbook

Every command anyone will run more than twice.

## Prerequisites

- .NET 10 SDK (`dotnet --version` should start with `10.`)
- Node 20+ and pnpm 9+ (`node -v`, `pnpm -v`)
- `sqlite3` CLI (optional; for DB inspection)

---

## Backend

```bash
# From the backend/ directory unless noted.

# ── First-run setup ──────────────────────────────────────────────────────────

# Generate a random JWT secret and store it in user-secrets (dev only).
dotnet user-secrets init --project BookTracker.Api
dotnet user-secrets set "Jwt:Secret" "$(openssl rand -base64 64)" --project BookTracker.Api

# Apply EF Core migrations (creates bookTracker.db in BookTracker.Api/).
dotnet ef database update --project BookTracker.Infrastructure --startup-project BookTracker.Api

# ── Day-to-day ───────────────────────────────────────────────────────────────

dotnet run --project BookTracker.Api
# API:     http://localhost:5000
# Swagger: http://localhost:5000/swagger

dotnet test                           # run all 31 tests
dotnet test --verbosity normal        # verbose output
dotnet build -warnaserror             # build with warnings-as-errors (same as CI)

# ── Migrations ───────────────────────────────────────────────────────────────

# Add a new migration after changing an entity or DbContext:
dotnet ef migrations add <Name> \
  --project BookTracker.Infrastructure \
  --startup-project BookTracker.Api

# Apply pending migrations:
dotnet ef database update \
  --project BookTracker.Infrastructure \
  --startup-project BookTracker.Api

# Reset the local DB entirely (wipes all data):
rm BookTracker.Api/bookTracker.db
dotnet ef database update \
  --project BookTracker.Infrastructure \
  --startup-project BookTracker.Api
```

---

## Frontend

```bash
# From the frontend/ directory.

pnpm install                          # install / sync node_modules
pnpm dev                              # dev server on http://localhost:3000
pnpm build                            # production build
pnpm lint                             # ESLint
pnpm typecheck                        # tsc --noEmit
pnpm test:e2e                         # Playwright (requires backend running on :5000)
pnpm gen:types                        # regenerate types.ts from running backend
```

---

## OpenAPI types freshness

The CI `openapi-freshness` job fails when `openapi.json` or `src/lib/api/types.ts` are out of sync with the actual backend. This happens any time you add, rename, or remove an endpoint field or response type.

**To fix locally:**

```bash
# 1. Start the backend (in one terminal):
cd backend
dotnet run --project BookTracker.Api

# 2. Regenerate types (in another terminal):
cd frontend
pnpm gen:types

# 3. Review the diff and commit both changed files:
git diff frontend/openapi.json frontend/src/lib/api/types.ts
git add frontend/openapi.json frontend/src/lib/api/types.ts
git commit -m "chore: regenerate OpenAPI types"
```

If the freshness job fails in CI but `pnpm gen:types` shows no local diff, the mismatch is probably caused by a non-deterministic Swashbuckle output (property order, enum sort). Run `git show HEAD:frontend/openapi.json` and compare against a fresh fetch from the CI log to identify the divergence.

---

## Inspecting the SQLite database

```bash
# The DB file lives next to the API project:
sqlite3 backend/BookTracker.Api/bookTracker.db

# Useful queries:
.tables                            # list tables
.schema Books                      # show Books DDL
SELECT * FROM AspNetUsers;         # all registered users
SELECT Id, UserId, Title, Status FROM Books;
SELECT COUNT(*) FROM Books GROUP BY UserId;  # books per user

# Pretty output:
.mode column
.headers on
SELECT * FROM Books LIMIT 10;

.quit
```

---

## Running both servers for E2E / manual testing

Playwright's `webServer` config in `playwright.config.ts` starts both servers automatically when you run `pnpm test:e2e`. For manual testing start them separately:

```bash
# Terminal 1 — backend
cd backend && dotnet run --project BookTracker.Api

# Terminal 2 — frontend
cd frontend && pnpm dev
```

Then open http://localhost:3000.

---

## Environment variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `Jwt__Secret` | `dotnet user-secrets` (dev) / env var (prod) | JWT signing key. Must be ≥32 bytes. Startup throws if missing. |
| `Jwt__Issuer` | `appsettings.json` | JWT issuer claim. Default: `bookworm-tracker`. |
| `Jwt__Audience` | `appsettings.json` | JWT audience claim. Default: `bookworm-tracker-client`. |
| `ConnectionStrings__Default` | `appsettings.json` | SQLite connection string. Default: `Data Source=bookTracker.db`. |
| `Cors__AllowedOrigin` | `appsettings.json` | Allowed CORS origin. Default: `http://localhost:3000`. |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Frontend → backend base URL. Default: `http://localhost:5000`. |

The double-underscore convention (`__`) maps to the colon-separated config key path in ASP.NET Core (`Jwt:Secret` → `Jwt__Secret` in environment).
