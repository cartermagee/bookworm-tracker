# Contributing

> **Status:** Phase 1 placeholder. Phase 4 expands this with the full code-style guide, PR flow, and a "how to add a feature" worked example.

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
build: switch to TargetFramework net9.0
```

The Husky `commit-msg` hook runs `commitlint` with `@commitlint/config-conventional`. Bad messages are rejected at commit time.

If you need to bypass hooks for a legitimate WIP commit: `git commit --no-verify`. Use sparingly; squash before merging.

## Code style

- Backend: `dotnet format` runs on staged files via lint-staged.
- Frontend: ESLint flat config + Prettier; both run on staged files.
- Warnings-as-errors is on at the build level (`Directory.Build.props` for .NET, `strict: true` for TS).

## Documentation

- ADRs are immutable. Decisions change via a new superseding ADR. See [ADR-0014](docs/adr/0014-comprehensive-docs.md).
- The README and the per-project READMEs aim for ruthless brevity. Link, don't duplicate.
