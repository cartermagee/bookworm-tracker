# ADR-0007: Integration-First Testing (B+ Plan)

**Status:** Accepted
**Date:** 2026-05-19

## Context

Testing strategies for a CRUD-with-auth app:

- **Minimal:** Smoke tests only. Too thin for "elite standards."
- **Targeted (B+):** Integration tests for endpoints via `WebApplicationFactory`, unit tests for components with real logic (validators, the Open Library client), a few Playwright E2E flows. ~25 tests, all load-bearing.
- **Full pyramid:** Unit tests for every service, controller, validator, mapper, plus integration, plus E2E. ~60+ tests.

A CRUD app of this shape has thin layers — most code is "take request → query DB → return response." Unit tests of thin layers test mocks, not behavior. Bugs live at the seams.

## Decision

The B+ plan: integration-first, ~25 tests, every one load-bearing.

- **Backend:** Integration tests via `WebApplicationFactory<Program>` with in-memory SQLite for endpoints (auth flows, books CRUD, multi-tenancy). Unit tests for the Open Library client (with mocked `HttpMessageHandler`) and FluentValidation validators.
- **Frontend:** No component unit tests. Three Playwright E2E flows (auth, books, protected routes).
- **The multi-tenancy test (user A cannot read user B's books) is written first, in Phase 1, and gates Phase 2 completion.**

## Consequences

- Tests catch real bugs at the seams (EF query correctness, auth middleware order, serialization, cookie flow). They do not test that mocks are wired correctly.
- The codebase stays small and the tests stay maintainable. Refactoring implementation without changing behavior does not cascade test changes.
- Test count is not the quality signal; **whether a failing test would tell you something you didn't already know** is the signal. Every test in this plan passes that bar.
- Adding "more tests for safety" without a specific bug to catch is explicitly out of scope. See `docs/TESTING.md` for the philosophy in detail.
