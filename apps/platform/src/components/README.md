# Components — Frontend Presentation Layer

This directory contains React components for the TRT platform UI.

## Authority Boundary

| Allowed | Forbidden |
|---|---|
| Display `ScoreSnapshot` data received as props | Compute or approximate scores |
| Render UI from API response data | Import the scoring engine |
| Collect user input via forms | Import snapshot builders |
| Display progress indicators and navigation | Import `MethodologyBundle` |
| Call API routes via `fetch` or TanStack Query | Import `@prisma/client` or `@/lib/db/*` |
| Import type definitions for display purposes | Construct snapshot objects |
| Use UI constants from `lib/constants.ts` | Access the database directly |

## Subdirectories

- `scoring/` — Score display components (`ScoreDisplays.tsx`, `ScoreRings.tsx`, `TierBadge.tsx`)
  - These components **only present** data — they never compute scores.
- `layout/` — App layout, navbar, footer
- `ui/` — Shadcn-style primitives (button, card, dialog, input, etc.)

## Data Flow

```
API Route returns ScoreSnapshot or preview data
  → React component receives data as props
  → Component renders display (rings, badges, numbers)
  → No computation, transformation, or inference of scores
```

## ESLint Enforcement

Files in this directory are subject to `no-restricted-imports` rules that
prevent importing backend-only modules. See `eslint.config.mjs`.

## Interaction Rules

- **Imports from:** `lib/constants.ts` (UI display constants), `lib/utils.ts`, engine type definitions (type-only)
- **Never imports:** Scoring engine, snapshot builders, methodology, database, orchestrators
- **Data source:** API responses and props — never direct database queries
