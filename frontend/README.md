# Bookworm Tracker — Frontend

Next.js 15 App Router + React 19 + TypeScript strict. See the root [README](../README.md) and [ADR-0004](../docs/adr/0004-app-router-server-components.md) for the why.

## Quickstart

```bash
cp .env.example .env.local
pnpm install
pnpm dev          # http://localhost:3000  (backend must be on http://localhost:5000)
```

## Scripts

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm gen:types    # regenerate src/lib/api/types.ts from openapi.json
pnpm test:e2e     # Playwright E2E (requires backend running)
pnpm format       # check formatting
pnpm format:write # apply formatting
```

## Generated artifacts

- `openapi.json` — snapshot of the backend OpenAPI spec, committed for offline type generation.
- `src/lib/api/types.ts` — generated TypeScript types from the snapshot. Committed.

If `pnpm gen:types` would produce a different `types.ts`, CI fails. See [ADR-0015](../docs/adr/0015-four-phase-orchestration.md) and the `Bookworm Tracker locked decisions` memo.
