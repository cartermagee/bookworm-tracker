# ADR-0002: Three-Project Backend (Api / Core / Infrastructure)

**Status:** Accepted
**Date:** 2026-05-19

## Context

ASP.NET Core projects can be structured several ways:

- **Single-project flat:** Everything in one project with folders (`/Controllers`, `/Models`, `/Data`). Minimum ceremony.
- **Three-project layered (Api / Core / Infrastructure):** Domain entities and interfaces in `Core`, EF Core and external clients in `Infrastructure`, HTTP layer in `Api`. References flow inward: `Api → Core ← Infrastructure`.
- **Full Clean Architecture / Vertical Slice with CQRS:** Four+ projects, MediatR, feature folders with command/query handlers.

For a learning project, the value is in learning which boundaries pay off, not in mechanically applying every pattern.

## Decision

Three-project layered backend: `BookTracker.Api`, `BookTracker.Core`, `BookTracker.Infrastructure`, plus a `BookTracker.Tests` project. `Core` has no dependencies on EF Core, ASP.NET, or HTTP. `Infrastructure` implements `Core` interfaces. `Api` depends on both.

## Consequences

- Forces interface-based design from day one (e.g., `IBookMetadataService` in `Core`, `OpenLibraryClient` in `Infrastructure`) — the central lesson of dependency inversion in .NET.
- EF Core entities live in `Core` to keep them as the single source of truth for the domain shape, even though EF is referenced from `Infrastructure`. This is a pragmatic compromise over "pure" Clean Architecture where entities would be ORM-agnostic.
- The Vertical Slice / CQRS path was rejected as ceremony-heavy for CRUD over a single entity; MediatR for `CreateBook` would be a meme at this scale.
