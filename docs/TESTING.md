# Testing

> **Status:** Phase 1 stub. Phase 4 writes the B+ testing philosophy in full, with links to specific tests as worked examples.

## TODO (Phase 4)

- The B+ philosophy: integration-first, ~25 tests, every one load-bearing.
- What we test and why: endpoint integration via `WebApplicationFactory`, the Open Library client with mocked `HttpMessageHandler`, FluentValidation validators, Playwright E2E for three flows.
- What we deliberately don't test: thin layers (DTO mappers, basic controllers, trivial mocks), implementation details that change without behavioral impact.
- The signal: "would this test failing tell me something I didn't already know?" If no, skip.
- The single most important test: [`MultiTenancyTests.cs`](../backend/BookTracker.Tests/Books/MultiTenancyTests.cs). Written in Phase 1 (skipped); Phase 2's first job is to make it pass.

See [ADR-0007](adr/0007-integration-first-testing.md).
