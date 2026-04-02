# Engine — Scoring Authority

This directory contains the **TRT Scoring Engine**, the sole computation
authority for the entire platform.

## Authority Boundary

**This layer IS the scoring authority.**

| Allowed | Forbidden |
|---|---|
| Compute GPS, DPS, DPI context, band classification | Access the database |
| Normalise indicators via `NormBounds` | Access environment variables |
| Apply pillar weights, sub-weights, composite weights | Make network calls |
| Classify GPS and DPS bands | Perform file I/O |
| Produce a full `ComputationTrace` | Use `Date.now()` or system time |
| Operate as a pure function | Infer values not in inputs |

## Data Flow

```
Orchestrator
  → passes (AssessmentSnapshot, DpiSnapshot, MethodologyBundle)
  → Engine computes all scores deterministically
  → returns ScoreSnapshot with ComputationTrace
  → Orchestrator persists the result
```

## Interaction Rules

- **Called by:** `lib/orchestration/scoring-orchestrator.ts` (and engine tests only)
- **Never called by:** React components, pages, API routes, hooks, stores
- **Imports from:** Only its own submodules (`pillars/`, `dps/`, `bands/`, `types.ts`)
- **Never imports:** `@prisma/client`, `@/lib/db/*`, `fetch`, `fs`, `process.env`

## Key Guarantee

Identical inputs **always** produce identical outputs. This is verified by
golden test vectors in `__tests__/golden-vectors.test.ts`.
