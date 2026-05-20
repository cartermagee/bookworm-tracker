# ADR-0003: SQLite via EF Core

**Status:** Accepted
**Date:** 2026-05-19

## Context

Database options for a small full-stack .NET app:

- **SQLite:** File-based, zero setup, ships with the repo. `dotnet ef database update` and you're running.
- **PostgreSQL:** Production-realistic, requires Docker or a local install.
- **SQL Server LocalDB:** The legacy Microsoft default; Windows-friendly, awkward elsewhere.

The project is a single-user-per-account learning app run locally. There is no production deployment yet.

## Decision

SQLite via `Microsoft.EntityFrameworkCore.Sqlite`. Connection string in `appsettings.Development.json` points to `bookTracker.db` in the API project working directory. The `.db` file is gitignored; migrations are checked in.

## Consequences

- `git clone && dotnet run` works with no additional setup. Lowest possible friction for any contributor or reviewer.
- EF Core is the abstraction layer; provider-specific code is minimal. Migrating to Postgres later is a `UseSqlite()` → `UseNpgsql()` swap plus regenerating migrations.
- Some Postgres-specific features (jsonb, arrays, full-text search) are unavailable. We don't need any of them for the locked scope.
- Provider-specific quirks (case sensitivity, function translations) will not be encountered here. That's a learning gap for a future project, not a problem for this one.
- SQL Server LocalDB was rejected because it pins tooling to Windows and is not where the modern .NET community center of gravity sits.
