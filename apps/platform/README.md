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

## Development Setup

### Prerequisites

- Node.js 20+
- Docker Desktop (for local PostgreSQL)

### Quick start

```bash
docker compose up -d          # start PostgreSQL in Docker
npm install                   # .npmrc handles React 19 peer dep flags automatically
npm run db:migrate            # apply migrations (also runs prisma generate)
npm run db:seed               # create admin, operator, traveler, territory, DPI snapshot
npm run dev                   # start Next.js at http://localhost:3000
```

### First-time setup

#### 1. Set up environment files

```bash
cp .env.example .env
cp .env.example .env.local
```

Generate an `AUTH_SECRET` and paste it into both files:

```bash
openssl rand -base64 32
```

`DATABASE_URL` in both files is pre-set to the Docker PostgreSQL instance — leave it as-is.

#### 2. Start the local database

```bash
docker compose up -d
```

PostgreSQL 15 starts at `localhost:5432`:
- User: `trt` · Password: `trt` · Database: `trt_platform`

#### 3. Install dependencies

```bash
npm install
```

> `.npmrc` (committed) sets `legacy-peer-deps=true` automatically. Some packages
> have not yet declared React 19 peer dep support — this flag is required until
> the ecosystem catches up.

#### 4. Run migrations and generate the Prisma client

```bash
npm run db:migrate
```

`prisma migrate dev` applies all pending migrations and automatically regenerates the Prisma client.

#### 5. Seed the database

```bash
npm run db:seed
```

Creates the minimum data to use the app:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@trt-local.dev` | `Admin1234!` |
| Operator | `operator@trt-local.dev` | `Operator1234!` |
| Traveler | `traveler@trt-local.dev` | `Traveler1234!` |

The seed also creates a territory (Costa Rica Highlands), a DPI snapshot, and seeds the methodology bundle record. Safe to re-run — all operations are idempotent.

#### 6. Start the development server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

### Database scripts

| Script | When to use |
|---|---|
| `db:migrate` | Local dev — creates + applies a new migration file |
| `db:migrate:deploy` | CI/CD / Railway — applies existing migrations, no interaction |
| `db:generate` | After manual schema edits without a migration |
| `db:push` | Prototyping only — syncs schema without migration history |
| `db:studio` | Opens Prisma Studio GUI at `localhost:5555` |

### Run tests

```bash
npm test
```

Golden vector tests must pass before merging. CI will fail if scoring output changes.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | JWT signing secret — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret |
| `NEXTAUTH_URL` | Production only | Public app URL for OAuth callbacks |

**Local dev:** values are in `.env` and `.env.local` (both gitignored).
**Railway (staging/production):** set all variables in the Railway dashboard — never in committed files.

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
