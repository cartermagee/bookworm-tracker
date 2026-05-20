# Runbook

> **Status:** Phase 1 stub. Phase 4 fills this in with every command anyone will run more than twice.

## Backend

```bash
# From the backend/ directory unless noted.

# First-run setup
dotnet user-secrets init --project BookTracker.Api
dotnet user-secrets set "Jwt:Secret" "$(openssl rand -base64 64)" --project BookTracker.Api
dotnet ef database update --project BookTracker.Infrastructure --startup-project BookTracker.Api

# Run the API
dotnet run --project BookTracker.Api

# Run tests
dotnet test

# Build with warnings-as-errors
dotnet build -warnaserror

# Add a new migration
dotnet ef migrations add <Name> --project BookTracker.Infrastructure --startup-project BookTracker.Api

# Reset the local DB
rm BookTracker.Api/bookTracker.db
dotnet ef database update --project BookTracker.Infrastructure --startup-project BookTracker.Api
```

## Frontend

```bash
# From the frontend/ directory.

pnpm install
pnpm dev          # boots Next.js dev server on http://localhost:3000
pnpm build
pnpm lint
pnpm typecheck
pnpm test:e2e     # Playwright; requires backend running on :5000

# Regenerate API types from the running backend
pnpm gen:types
```

## TODO (Phase 4)

- Document the OpenAPI freshness check in CI and how to fix a "types.ts would change" failure.
- Document the gitleaks bypass procedure for false positives.
- Document the `--no-verify` Husky escape hatch (already in CONTRIBUTING).
- Document how to inspect the SQLite DB with the `sqlite3` CLI.
