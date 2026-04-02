# API Routes — Server-Side Orchestration Layer

This directory contains Next.js API route handlers that serve as the
boundary between frontend and backend.

## Authority Boundary

| Allowed | Forbidden |
|---|---|
| Authenticate and authorise requests | Contain scoring formulas |
| Validate request bodies with Zod | Invoke `computeScore()` directly |
| Derive P1/P2 indicators from raw inputs | Return raw `MethodologyBundle` to clients |
| Delegate to orchestrators for scoring | Bypass validation |
| Return serialised data to the frontend | Skip auth checks |
| Create and manage evidence references | Expose database internals |
| Access the database via repositories | |

## Key Routes

| Route | Purpose |
|---|---|
| `POST /api/v1/score` | Full scoring run (via scoring orchestrator) |
| `POST /api/v1/score/preview` | Preview scores without persistence |
| `POST /api/v1/onboarding` | Save onboarding progress |
| `POST /api/v1/onboarding/draft` | Save/load onboarding draft |
| `POST /api/v1/evidence` | Submit evidence reference |
| `GET /api/v1/operator/dashboard` | Load operator dashboard data |
| `GET /api/v1/dpi` | Load DPI data for territory |
| `POST /api/v1/admin/evidence/[id]/verify` | Admin evidence verification |

## Data Flow

```
Frontend (fetch / TanStack Query)
  → API Route: auth → validate → derive indicators
  → Orchestrator: build snapshot → invoke engine → persist
  → API Route: serialise → return JSON
  → Frontend: display response
```

## Interaction Rules

- **Called by:** Frontend via `fetch()` or TanStack Query
- **Delegates to:** Orchestrators, repositories, validation schemas
- **Never called by:** Other API routes (use shared functions instead)
- **Never imports into:** Frontend components (only called via HTTP)
