# TRT Platform — Green Passport

**The Regenerative Tourism · Green Passport Platform**  
Technical Design Document v4.0 compliant implementation.

---

## Architecture Overview

```
Frontend (Next.js UI — presentation only)
        ↓
API Routes (auth + validation + orchestration)
        ↓
Snapshot Construction (AssessmentSnapshot | DpiSnapshot)
        ↓
TRT Scoring Engine (pure compute — deterministic)
        ↓
ScoreSnapshot (immutable record)
        ↓
PostgreSQL (append-only persistence via Prisma)
        ↓
Frontend display (reads from ScoreSnapshot)
```

## Critical Architectural Rule

**The TRT Scoring Engine is the ONLY component allowed to compute scores.**

- GPS calculations, pillar scoring, DPS, band classification: `lib/engine/trt-scoring-engine/`
- No scoring logic in: React components, API routes, services, repositories, Zustand stores, or TanStack Query hooks

## Project Structure

```
src/
  app/                        # Next.js App Router
    (public)/                 # Public pages (landing, operator profiles)
    (operator)/               # Operator-authenticated pages
    (admin)/                  # Admin-authenticated pages
    (traveler)/               # Traveler-authenticated pages
    api/v1/                   # API routes (orchestrate, never compute)

  lib/
    engine/
      trt-scoring-engine/     # ← SCORING AUTHORITY. Only module that computes.
        compute-score.ts      #   Public interface: computeScore()
        types.ts              #   AssessmentSnapshot, DpiSnapshot, ScoreSnapshot
        pillars/              #   P1, P2, P3 computation
        dps/                  #   DPS-1, DPS-2, DPS-3
        bands/                #   GPS band classification
        __tests__/            #   Golden test vectors (CI protection)

    methodology/
      default-bundle.ts       # MethodologyBundle v1.0.0
      methodology-bundle.loader.ts

    snapshots/
      assessment-snapshot.builder.ts  # Builds + hashes AssessmentSnapshot
      dpi-snapshot.builder.ts         # Builds + hashes DpiSnapshot

    orchestration/
      scoring-orchestrator.ts  # Validates → builds → invokes engine → persists
      dpi-orchestrator.ts      # DPI data fetch → builds → persists

    db/
      prisma.ts                # Prisma client singleton
      repositories/            # Data access layer (no scoring logic)
        operator.repo.ts
        assessment.repo.ts
        score.repo.ts
        dpi.repo.ts
        territory.repo.ts
        evidence.repo.ts

    validation/                # Zod schemas for all snapshot contracts
    audit/                     # Append-only audit logger
    auth/                      # JWT session management
    constants.ts               # UI display constants (NOT scoring definitions)

  components/
    scoring/ScoreDisplays.tsx  # Displays ScoreSnapshot data (never computes)
    layout/
  
  hooks/
    useAuth.tsx                # Client auth context
  
  store/
    onboarding-store.ts        # Zustand: UI state only, no scoring logic
```

## Data Flow

1. Operator completes assessment form (`(operator)/onboarding/`)
2. Form submits to `POST /api/v1/score`
3. API route validates input with Zod, verifies operator ownership
4. **Scoring Orchestrator** (`lib/orchestration/scoring-orchestrator.ts`):
   - Builds `AssessmentSnapshot` with SHA-256 hash
   - Loads active `DpiSnapshot` for territory
   - Loads active `MethodologyBundle`
   - Invokes `computeScore(assessment, dpi, methodology)` — the engine
   - Persists the resulting `ScoreSnapshot` (immutable, append-only)
5. Dashboard reads from `GET /api/v1/operator/dashboard` → renders `ScoreSnapshot`

## Engine Guarantees

| Property | Implementation |
|---|---|
| Deterministic | Same inputs always produce same outputs |
| Stateless | No shared mutable state between calls |
| Side-effect free | No DB, network, or filesystem access |
| Replayable | Historical GPS reproducible from source snapshots |
| Auditable | Full `computationTrace` in every `ScoreSnapshot` |

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations (requires DATABASE_URL env var)
npm run db:migrate

# Start dev server
npm run dev

# Run golden tests (CI)
npm test
```

## Environment Variables

```env
DATABASE_URL=postgresql://...   # PostgreSQL connection string
SESSION_SECRET=...              # JWT signing secret (min 32 chars)
```

## Scoring Formula

**Cycle 1 (baseline):**
```
GPS = (P1 × 0.40) + (P2 × 0.30) + (P3 × 0.30)
DPS = 0 (by definition)
```

**Cycle 2+:**
```
GPS = clamp((P1 × 0.40) + (P2 × 0.30) + (P3 × 0.30) + DPS, 0, 100)
DPS = DPS-1 + DPS-2 + DPS-3
```

## Methodology Governance

- Scoring weights, thresholds, and normalisation bounds are in `lib/methodology/default-bundle.ts`
- Every `ScoreSnapshot` references exactly one `methodologyVersion` + `bundleHash`
- Historical scores are reproducible indefinitely by passing source snapshots to the engine
- New methodology versions create new bundle records — old bundles are never deleted

---

*Technical Design Document v4.0 · March 2026 · For Developer Use*
