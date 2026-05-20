# ADR-0001: Scope — B-lite (CRUD + Auth)

**Status:** Accepted
**Date:** 2026-05-19

## Context

This project is a learning exercise to build a full-stack app with .NET and Next.js. Several scope shapes were considered:

- **A (minimal):** Single-user local app, CRUD + Open Library, no auth. ~4-6 hours of work.
- **B (standard):** A + auth + stats dashboard + tags/shelves + reading progress + Postgres. Full day or more.
- **C (ambitious):** B + social features + recommendations + PWA + deployed. Multi-day, high one-shot failure risk.

The goals competing for priority were: educational depth, completion likelihood in a one-shot multi-agent run, and signaling production-quality engineering.

## Decision

Scope is **B-lite**: scope A plus ASP.NET Core Identity authentication with JWT-in-httpOnly-cookie. Specifically excluded: stats dashboard, custom shelves/tags, reading progress tracking, Postgres, social features, deployment automation, PWA.

## Consequences

- Auth is the single most valuable .NET concept to learn that cannot be faked; including it forces real engagement with Identity, EF migrations, middleware pipeline, cookies, CORS-with-credentials, and protected routes.
- Excluding stats and shelves preserves the "small enough to fully grasp" property. Both would add LINQ-query practice but no new architectural concepts.
- The one-shot is achievable. Auth roughly doubles surface area vs. A, but the contract-first orchestration (ADR-0015) mitigates the integration risk.
- Excluded features become natural follow-up projects with clear scopes of their own.
