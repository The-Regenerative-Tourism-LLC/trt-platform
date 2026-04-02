# Orchestration — Scoring & DPI Workflow Coordination

This directory contains orchestrators that coordinate the full scoring and
DPI computation workflows.

## Authority Boundary

| Allowed | Forbidden |
|---|---|
| Build snapshots via builders | Be imported from frontend code |
| Invoke the scoring engine via `computeScore()` | Contain scoring formulas |
| Lock baseline/prior scores from the database | Be called from client components |
| Apply the T3 evidence gate | Expose internals to the frontend |
| Persist snapshots and scores | Modify persisted snapshots |
| Create audit log entries | Skip validation steps |

## Files

- `scoring-orchestrator.ts` — Full scoring run: validate → snapshot → baseline lock → engine → T3 gate → persist
- `dpi-orchestrator.ts` — DPI computation: fetch data → compute → snapshot → persist

## Data Flow

### Scoring Orchestrator

```
API Route (POST /api/v1/score)
  → validates + derives indicators server-side
  → calls runScoring(input)
    → builds AssessmentSnapshot
    → locks baseline from DB (Cycle 2+)
    → loads DpiSnapshot for territory
    → loads MethodologyBundle
    → invokes computeScore() — the engine
    → applies T3 evidence gate
    → persists ScoreSnapshot (append-only)
    → increments cycle count
    → audit log
  → returns ScoringResult to API route
  → API route returns JSON to frontend
```

### DPI Orchestrator

```
API Route or Background Worker
  → calls runDpiComputation(territoryId, actorUserId)
    → fetches World Bank data
    → computes regenerative performance from published scores
    → builds DpiSnapshot
    → persists snapshot (append-only)
    → updates territory read model
    → audit log
  → returns DpiResult
```

## Interaction Rules

- **Called by:** API routes (`app/api/`) and background workers only
- **Never called by:** React components, pages, hooks, stores
- **Imports from:** Engine, snapshot builders, repositories, methodology loader
- **Never imported by:** Frontend modules
