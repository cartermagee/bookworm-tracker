# ADR-0015: Four-Phase Orchestration (Contract → Parallel Implementation → Integration → Docs)

**Status:** Accepted
**Date:** 2026-05-19

## Context

Multi-agent execution strategies for a one-shot build:

- **Sequential single-agent:** One agent end-to-end. Safest, slowest, accumulates context-window pressure on later steps.
- **Parallel-from-start:** Backend + frontend + docs agents working concurrently. Fast but contracts drift between them; integration failures appear late.
- **Phased parallel:** Sequential phases, parallel agents within each phase. Contract locked in Phase 1 before any parallel implementation begins.

The integration risk in multi-agent builds is real: two agents independently deciding response shapes will diverge, and the mismatch surfaces only at integration time when both sides have committed to incompatible assumptions.

## Decision

Four phases:

1. **Phase 1 — Scaffolding & Contract** (single agent): Directory structure, all tooling, three-project backend with stub endpoints that compile and return 501, full OpenAPI spec via Swashbuckle, generated TypeScript types committed, Next.js scaffold with stub pages, EF Core data model and initial migration, all 15 ADRs, the failing multi-tenancy test.
2. **Phase 2 — Parallel Implementation** (three concurrent agents):
   - Backend agent with subagents per feature (Auth, Books, Open Library)
   - Frontend agent (no subagents — frontend has more cross-cutting state)
   - Tooling agent (CI finalization, hook verification, parallel-safe)
3. **Phase 3 — Integration** (single agent): Full-stack smoke test, Playwright E2E suite, manual two-user tenancy verification, fix the seams (cookies, CORS, env vars).
4. **Phase 4 — Documentation Finalization** (single agent): README, RUNBOOK, ARCHITECTURE, CONTRIBUTING, XML docs. Written *after* integration, so docs describe reality rather than intent.

## Consequences

- The OpenAPI spec is locked before parallel work begins; neither backend nor frontend can drift from it without immediate, visible compile-time failure.
- Phase 2 parallelism delivers most of the throughput gain. Phase 1 setup time is the cost; it's amortized across all subsequent agents.
- The multi-tenancy test sitting in the repo from Phase 1 (skipped, with explicit "Phase 2 must remove this Skip") forces backend agent to address tenancy correctly from the first query.
- Docs written *after* integration describe what was actually built, not what was intended. This eliminates the "the README says X but the code does Y" failure mode common in one-shot builds.
- Integration (Phase 3) is expected to find 2-3 real seams; this is the phase's purpose, not a failure.
