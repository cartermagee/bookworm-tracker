# ADR-0011: FluentValidation for Request Validation

**Status:** Accepted
**Date:** 2026-05-19

## Context

Request validation options in ASP.NET Core:

- **Data Annotations:** `[Required]`, `[StringLength]`, `[Range]` on DTO properties. Built-in.
- **FluentValidation:** Separate validator class per DTO; rules expressed as fluent chains.
- **Manual:** `if` statements in handlers returning `ValidationProblem` directly.

The validation surface for this app includes a conditional rule (`DateFinished` required if and only if `Status == Read`), which Data Annotations express awkwardly via `IValidatableObject`.

## Decision

FluentValidation. One validator class per request DTO, colocated with the DTO in its feature folder. Validators registered via `AddValidatorsFromAssemblyContaining<Program>()`. A custom endpoint filter (`ValidationFilter<T>`) runs the validator before the handler and returns `ValidationProblem` on failure.

## Consequences

- Conditional rules read cleanly: `RuleFor(x => x.DateFinished).NotNull().When(x => x.Status == BookStatus.Read)`.
- Validators are testable as plain classes — fast unit tests without `WebApplicationFactory`.
- Validation rules are decoupled from DTO shape; the same DTO could have multiple validators in different contexts if ever needed.
- **DbContext access in validators is forbidden.** Validators are pure functions of input. Uniqueness checks (e.g., email-not-taken) live in handlers/services, not validators. This separation keeps validators fast, deterministic, and unit-testable.
- The cost is one additional NuGet package and ~20 lines for the endpoint filter. Both pay back immediately.
