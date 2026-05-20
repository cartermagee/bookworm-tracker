# ADR-0014: Comprehensive Documentation (README + ADRs + Architecture + Testing + Runbook)

**Status:** Accepted
**Date:** 2026-05-19

## Context

Documentation tiers considered:

- **Minimum:** README only.
- **Standard:** README + ARCHITECTURE.md + per-project READMEs + XML doc comments on public APIs.
- **Comprehensive:** Standard plus ADRs, CONTRIBUTING, RUNBOOK, TESTING philosophy, Swagger UI.

Documentation has a different cost curve than tests: maintenance is lower-frequency, drift is more visible, and the artifact is where decisions become legible to anyone other than the original author.

## Decision

Comprehensive documentation. Specifically:

- `README.md` (ruthlessly short — ~150 lines max, link-heavy)
- `CONTRIBUTING.md` (code style, commits, PR flow, "how to add a feature" worked example)
- `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/RUNBOOK.md`
- `docs/adr/` — one ADR per locked decision (this is #14)
- `backend/README.md`, `frontend/README.md` (per-project dev commands)
- XML doc comments on public types in `Core` and `Infrastructure` only — not on every method
- Swagger UI at `/swagger` in development

**Explicitly skipped:** A separate `API.md` listing endpoints. The OpenAPI spec + Swagger UI is the API doc; a parallel markdown table would drift.

## Consequences

- A reviewer can understand the project end-to-end without needing the original author present. The ADRs in particular make decisions legible six months from now.
- ADRs are **immutable once accepted.** Decisions change by writing a new superseding ADR, never by editing old ones. Append-only history preserves reasoning.
- Documentation maintenance is real but manageable. The Runbook and Architecture doc carry the most drift risk; they live next to the code and are reviewed alongside it.
- XML doc comments are scoped to public package surfaces, not implementation details, to avoid the "comment everything" trap that produces noise without signal.
