# Bookworm Tracker — Backend

.NET 9 Minimal APIs. Three projects (`Api` / `Core` / `Infrastructure`) + `Tests`. See [ADR-0002](../docs/adr/0002-three-project-backend.md).

## First-run setup

```bash
dotnet user-secrets init --project BookTracker.Api
dotnet user-secrets set "Jwt:Secret" "$(openssl rand -base64 64)" --project BookTracker.Api
# Migration is applied automatically on first run in Development; you can also run it manually:
dotnet ef database update --project BookTracker.Infrastructure --startup-project BookTracker.Api
```

## Run

```bash
dotnet run --project BookTracker.Api
# API:     http://localhost:5000
# Swagger: http://localhost:5000/swagger
# Health:  http://localhost:5000/health
```

## Test

```bash
dotnet test
```

The multi-tenancy test ([`BookTracker.Tests/Books/MultiTenancyTests.cs`](BookTracker.Tests/Books/MultiTenancyTests.cs)) is marked `[Fact(Skip = "Phase 2 implements this — remove Skip when ready")]` in Phase 1. Phase 2's Books subagent removes the Skip and makes it pass — see [ADR-0007](../docs/adr/0007-integration-first-testing.md).

## Build

```bash
dotnet build -warnaserror
```

## Migrations

```bash
# Add
dotnet ef migrations add <Name> --project BookTracker.Infrastructure --startup-project BookTracker.Api --output-dir Persistence/Migrations
# Remove the last
dotnet ef migrations remove --project BookTracker.Infrastructure --startup-project BookTracker.Api
# Reset DB
rm BookTracker.Api/bookTracker.db
dotnet ef database update --project BookTracker.Infrastructure --startup-project BookTracker.Api
```

## Project boundaries

- `BookTracker.Core` — entities, abstractions. No EF, no ASP.NET, no HTTP.
- `BookTracker.Infrastructure` — EF Core configuration, the OpenLibrary client. References `Core`.
- `BookTracker.Api` — endpoints, DI wiring, ProblemDetails, auth. References both.
- `BookTracker.Tests` — integration tests via `WebApplicationFactory<Program>`. References all three.

`Program.cs` is the central wiring file — read it top-to-bottom to see the pipeline order, the JWT-cookie auth setup, the camelCase FluentValidation key resolver, and the dev-only Migrate() call.
