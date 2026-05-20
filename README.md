# Bookworm Tracker

A single-user-per-account book library and reading tracker. Built on .NET 9 Minimal APIs + Next.js 15 App Router.

> **Status:** in progress. Phase 1 scaffolding committed. See [ADR-0015](docs/adr/0015-four-phase-orchestration.md) for the build plan.

## Quickstart

Requires: .NET 9 SDK, Node 20+, pnpm 9+.

```bash
# Backend
cd backend
dotnet user-secrets init --project BookTracker.Api
dotnet user-secrets set "Jwt:Secret" "$(openssl rand -base64 64)" --project BookTracker.Api
dotnet ef database update --project BookTracker.Infrastructure --startup-project BookTracker.Api
dotnet run --project BookTracker.Api
# API:     http://localhost:5000
# Swagger: http://localhost:5000/swagger

# Frontend (new shell)
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev
# App: http://localhost:3000
```

## Project layout

- `backend/` — .NET 9 solution. Three projects (`Api` / `Core` / `Infrastructure`) plus `Tests`. See [`backend/README.md`](backend/README.md).
- `frontend/` — Next.js 15 App Router + TypeScript strict. See [`frontend/README.md`](frontend/README.md).
- `docs/` — [ARCHITECTURE](docs/ARCHITECTURE.md), [TESTING](docs/TESTING.md), [RUNBOOK](docs/RUNBOOK.md), and [ADRs](docs/adr/) documenting every locked decision.

## What this app does

Signed-in users can search Open Library for books and import them, manually add books that aren't there, mark each as **WantToRead / Reading / Read** with an optional 1–5 rating and notes, and filter/sort their personal library. Multi-tenancy is enforced server-side — each user only ever sees their own books.

## Why these choices

Every major decision has a one-page ADR:

- [0001 — Scope: B-lite](docs/adr/0001-scope-b-lite.md)
- [0002 — Three-project backend](docs/adr/0002-three-project-backend.md)
- [0003 — SQLite via EF Core](docs/adr/0003-sqlite-via-ef-core.md)
- [0004 — App Router + Server Components](docs/adr/0004-app-router-server-components.md)
- [0005 — Local-first data model](docs/adr/0005-local-first-data-model.md)
- [0006 — JWT in httpOnly cookie](docs/adr/0006-httponly-cookie-auth.md)
- [0007 — Integration-first testing](docs/adr/0007-integration-first-testing.md)
- [0008 — Full tooling stack](docs/adr/0008-full-tooling-stack.md)
- [0009 — Minimal APIs grouped](docs/adr/0009-minimal-apis-grouped.md)
- [0010 — ProblemDetails for errors](docs/adr/0010-problemdetails-errors.md)
- [0011 — FluentValidation](docs/adr/0011-fluentvalidation.md)
- [0012 — No API versioning](docs/adr/0012-no-api-versioning.md)
- [0013 — Tailwind + shadcn/ui](docs/adr/0013-tailwind-shadcn.md)
- [0014 — Comprehensive documentation](docs/adr/0014-comprehensive-docs.md)
- [0015 — Four-phase orchestration](docs/adr/0015-four-phase-orchestration.md)

## Future: Public API

This API is internal-only (one consumer, deployed in lockstep). If it's ever exposed externally, see [ADR-0012](docs/adr/0012-no-api-versioning.md) for the versioning plan and the wider work (auth scheme, rate limiting, SLA) that would gate it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All commits must follow [Conventional Commits](https://www.conventionalcommits.org/); commitlint enforces this in a Husky hook.

## License

[MIT](LICENSE).
