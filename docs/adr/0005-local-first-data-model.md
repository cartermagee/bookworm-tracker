# ADR-0005: Local-First Data Model; Open Library as Autofill Only

**Status:** Accepted
**Date:** 2026-05-19

## Context

The app integrates with Open Library for book metadata. Three positioning options:

- **Local-first:** `Book` table stores all fields as plain columns. Open Library is a search/autofill helper; after import, the book is independent of Open Library.
- **Reference-based:** Store only `OpenLibraryWorkId` and user-specific data; fetch metadata live with caching.
- **Hybrid snapshot:** Store the Open Library ID plus a snapshot of fields; support refresh-on-demand.

Open Library has rate limits, occasional downtime, and a complex edition/work model. Users may also want to add books not in Open Library at all.

## Decision

Local-first. On import, copy title/author/cover/ISBN into our row. Store `OpenLibraryWorkId` as a soft reference (nullable). After import, the book is the user's — fully editable, fully independent of Open Library. Manual book entry (no Open Library match) is a first-class flow.

## Consequences

- The app works fully offline once books are added; Open Library availability does not affect viewing or editing.
- Users can correct Open Library errors (typos, wrong covers) without fighting a "canonical source."
- No need for caching, rate-limit handling on read paths, or fallback UI for upstream failures.
- Future "refresh from Open Library" or "match unmatched books" features remain easy to add; they are not the default.
- We accept that book records can drift from Open Library's data over time. For a personal library this is correct behavior, not a bug.
