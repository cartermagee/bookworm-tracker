# ADR-0004: Next.js App Router with Server Components + TanStack Query

**Status:** Accepted
**Date:** 2026-05-19

## Context

Next.js offers two routing paradigms and several patterns for backend communication:

- **App Router + Server Components:** Current default; server-side data fetching, streaming HTML, client components opt-in via `"use client"`.
- **App Router + BFF (Next.js API routes proxy to .NET):** Frontend never calls .NET directly; Next.js routes proxy. Cleaner separation; more layers.
- **Pages Router + client-side fetching:** Older paradigm; SPA-like; all fetches from the browser.

The backend is .NET; the frontend is Next.js. They will run as separate processes communicating via HTTP.

## Decision

App Router with Server Components for read paths (book list, book detail). TanStack Query for client-side mutations (add/edit/delete book, Open Library search). No Next.js API routes — the .NET API is hit directly. OpenAPI-generated TypeScript types are the contract between them.

## Consequences

- Reads are server-rendered with no client-side loading spinners on first paint — the right pattern for book lists and detail pages.
- Mutations use TanStack Query for optimistic updates, cache invalidation, and a clean error/loading state model.
- The BFF pattern was rejected because no auth-token-juggling layer is needed (cookies flow through naturally) and it would mostly be empty proxy routes. When/if a true BFF is justified (multi-backend aggregation, server-side secrets), this decision can be revisited.
- Pages Router was rejected as the deprecated-in-spirit pattern; learning it teaches yesterday's Next.js.
