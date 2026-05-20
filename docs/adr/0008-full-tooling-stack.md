# ADR-0008: Full Tooling Stack (Husky + commitlint + gitleaks + Renovate + CodeQL)

**Status:** Accepted
**Date:** 2026-05-19

## Context

Code-quality tooling has a different cost profile than tests: set up once, runs forever, no maintenance burden, no false-positive triage. Three tiers were considered:

- **Minimum:** Formatters only (.editorconfig, Prettier, `dotnet format`).
- **Standard:** Formatters + linters + analyzers, enforced in CI, `TreatWarningsAsErrors`, strict TypeScript.
- **Maximum:** Standard plus pre-commit hooks, commit-message linting, dependency automation, secret scanning, security scanning.

For tests we chose discipline over volume. For tooling the asymmetry runs the other way — more tooling has near-zero ongoing cost and high marginal value.

## Decision

Full tooling stack:

- `.editorconfig` and `Directory.Build.props` enforce style + warnings-as-errors on the backend.
- `tsconfig.json` with `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`; ESLint flat config; Prettier.
- Husky pre-commit hook running `lint-staged`: format + lint staged files, plus `gitleaks protect --staged`.
- Husky commit-msg hook running commitlint with `@commitlint/config-conventional`.
- Renovate (not Dependabot) for grouped dependency PRs.
- GitHub Actions: CI (build/test/lint/typecheck), CodeQL (security analysis), gitleaks (secret scan).

**Skipped:** SonarCloud (signup friction, overlap with Roslyn + ESLint, noisy code-smell backlog with low actionable value).

## Consequences

- Day-one code quality is high and stays high by default; agents and humans cannot commit code that violates the standards.
- Pre-commit hook execution is the cost — adds 2-5 seconds per commit. The `--no-verify` escape hatch is documented in `CONTRIBUTING.md` for legitimate WIP cases.
- CodeQL catches real security issues (SQL injection, XSS, unsafe deserialization) for free; SonarCloud's incremental value over it was not worth the setup.
- Renovate's grouped weekly PRs are tractable; Dependabot's per-package PRs would create review noise.
