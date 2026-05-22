# ADR-0016: Bump Target Framework from net9.0 to net10.0

**Status:** Accepted  
**Date:** 2026-05-21  
**Supersedes:** locked-decision memo item "TargetFramework = net9.0" (see ADR-0002)

## Context

The original spec (master prompt §3, ADR-0002) locked the backend stack at **.NET 9** (`net9.0`). During Phase 2.5 the decision was made to bump to **.NET 10** to resolve a chain of concrete problems:

1. **Transitive vulnerability audit noise.** `NuGetAudit` flagged unfixable transitive CVEs in the .NET 9 Microsoft package graph. The standard mitigation (`NuGetAuditMode=direct`) suppresses them but leaves the underlying packages unpatched.
2. **Swashbuckle non-nullable schema gap.** The Swashbuckle 6.x line (the .NET 9-era release) does not populate `required[]` for non-nullable positional record properties, forcing a custom `RequireNonNullablePropertiesSchemaFilter`. The .NET 10-era Swashbuckle 8.x resolves this at the source; the workaround remains in place but is no longer load-bearing.
3. **LTS alignment.** .NET 10 is the next LTS release (GA: November 2025). Targeting it now means the first production deployment is already on a supported, long-lived runtime rather than the preceding STS release.

## Decision

All three backend projects (`BookTracker.Api`, `BookTracker.Core`, `BookTracker.Infrastructure`) and the test project (`BookTracker.Tests`) were bumped to `<TargetFramework>net10.0</TargetFramework>`. All `Microsoft.*` NuGet references that had both 9.x and 10.x versions were updated to the 10.x variants. The CI `setup-dotnet` action was updated from `9.0.x` to `10.0.x`.

The `NuGetAuditMode=direct` entry in `Directory.Build.props` was retained; the transitive noise it suppressed is resolved by the runtime bump, but leaving the setting prevents it from regressing silently if new transitives are added.

## Consequences

- All 31 backend tests continue to pass under net10.0.
- `tsc --noEmit` and the frontend build are unaffected (the API contract is unchanged).
- Any contributor setting up the project needs the .NET 10 SDK. The README and RUNBOOK have been updated accordingly.
- If .NET 10 preview breaking changes affect the project before GA, this ADR is the record that explains why the bump happened; a revert to net9.0 (or forward to the RC) should cite this ADR.
