# Architecture Guardrails — TRT Platform

This document defines the **authority boundaries, layer responsibilities, and
immutability constraints** that protect the scoring integrity of the TRT Green
Passport platform.

Every contributor — human or AI — must respect these guardrails.

---

## 1. Authority Boundaries

### 1.1 Scoring Authority

Only the TRT Scoring Engine computes:

- **GPS** (Green Passport Score) — weighted pillar aggregate
- **DPS** (Directional Progress Score) — DPS-1 + DPS-2 + DPS-3
- **DPI** composite (Destination Pressure Index) — weighted sum in snapshot builder
- **Band classification** — GPS band and DPS band
- **Indicator normalisation** — raw value → 0-100 via `NormBounds`
- **Delta calculations** — improvement/regression from baseline and prior cycle
- **Weight application** — pillar weights, sub-weights, composite weights

No other layer may reproduce or approximate these computations.

### 1.2 Orchestration Authority

Only the Scoring Orchestrator (`lib/orchestration/scoring-orchestrator.ts`) may:

- Invoke `computeScore()`
- Build and persist `AssessmentSnapshot` + `ScoreSnapshot` in the same transaction
- Lock baseline and prior scores from the database for delta computation
- Apply the T3 evidence gate

Only the DPI Orchestrator (`lib/orchestration/dpi-orchestrator.ts`) may:

- Fetch external DPI component data
- Build and persist `DpiSnapshot`

### 1.3 Snapshot Construction Authority

Snapshots may only be constructed by:

| Snapshot Type | Authorised Builder |
|---|---|
| `AssessmentSnapshot` | `lib/snapshots/assessment-snapshot.builder.ts` |
| `DpiSnapshot` | `lib/snapshots/dpi-snapshot.builder.ts` |
| `ScoreSnapshot` | TRT Scoring Engine (`computeScore()`) |

---

## 2. Layer Responsibilities

### 2.1 Frontend (React Components, Pages, Hooks, Stores)

**Allowed:**

- Collect form data from operators and travellers
- Display `ScoreSnapshot` data received as props or from API responses
- Display preview data returned by `POST /api/v1/score/preview`
- Upload evidence files via `POST /api/v1/evidence`
- Display progress indicators, navigation, and UI state
- Read UI-only constants from `lib/constants.ts`

**Forbidden:**

- Compute, approximate, or infer GPS / DPS / DPI / pillar scores
- Recreate normalisation, weight application, or band classification formulas
- Access or import `MethodologyBundle` or `default-bundle.ts`
- Import the scoring engine module (`@/lib/engine/trt-scoring-engine`)
- Import snapshot builders (`@/lib/snapshots/*`)
- Import `@prisma/client` or `@/lib/db/prisma`
- Construct `AssessmentSnapshot`, `DpiSnapshot`, or `ScoreSnapshot` objects
- Modify any `ScoreSnapshot` fields before display
- Access object storage directly

### 2.2 API Routes (`app/api/`)

**Allowed:**

- Authenticate and authorise requests via session middleware
- Validate request bodies with Zod schemas
- Derive P1/P2 indicators from raw inputs server-side
- Delegate to orchestrators for scoring runs
- Return serialised `ScoreSnapshot` data to the frontend
- Create, read, and manage evidence references

**Forbidden:**

- Contain scoring formulas, normalisation logic, or weight constants
- Invoke `computeScore()` directly (must go through orchestrators)
- Return raw `MethodologyBundle` to clients

### 2.3 Snapshot Construction (`lib/snapshots/`)

**Allowed:**

- Receive fully resolved data and construct typed snapshot objects
- Compute SHA-256 integrity hashes from canonical JSON
- Return immutable snapshot objects

**Forbidden:**

- Query the database
- Access environment variables
- Modify snapshots after construction

### 2.4 Scoring Engine (`lib/engine/trt-scoring-engine/`)

**Allowed:**

- Receive `(AssessmentSnapshot, DpiSnapshot, MethodologyBundle)` as pure inputs
- Compute all pillar scores, GPS, DPS, DPI context, and band classification
- Return a `ScoreSnapshot` with a full `ComputationTrace`

**Forbidden:**

- Access the database (`@prisma/client`, repositories, SQL)
- Access environment variables (`process.env`)
- Make network calls (`fetch`, HTTP clients)
- Perform file I/O (`fs`, `path`)
- Use `Date.now()` or any system time
- Infer values not present in the provided inputs
- Maintain mutable state between invocations

### 2.5 Database Layer (`lib/db/`)

**Allowed:**

- Expose Prisma client singleton
- Provide repository functions for CRUD operations
- Enforce data access patterns (no direct Prisma usage outside repositories)

**Forbidden:**

- Contain business logic, scoring formulas, or validation rules
- Be imported in client components, static generation, or the scoring engine

### 2.6 Object Storage

- Evidence files (PDFs, images) are stored in object storage
- Only checksums and metadata (`EvidenceRef`) are persisted in the database
- Object storage must **never** be accessed from client components

---

## 3. Snapshot Immutability

### 3.1 Immutable Types

The following types are **immutable** — every property is `readonly`:

- `AssessmentSnapshot`
- `DpiSnapshot`
- `ScoreSnapshot`
- `DeltaBlock`
- `EvidenceRef`
- `P1Responses`, `P2Responses`, `P3Responses`
- `ComputationTrace`
- `MethodologyBundle`
- `NormBounds`

### 3.2 Append-Only Database Constraint

- `AssessmentSnapshot` rows are **never** updated or deleted after creation.
- `DpiSnapshot` rows are **never** updated or deleted after creation.
- `ScoreSnapshot` rows are **never** updated or deleted after creation.
- `PostTripReport` rows are **never** updated or deleted after creation.
- New assessments create **new** snapshot rows. Old rows remain for audit.

### 3.3 Integrity Hashes

- Every `AssessmentSnapshot` carries a `snapshotHash` (SHA-256 of canonical JSON).
- Every `DpiSnapshot` carries a `snapshotHash`.
- Every `ScoreSnapshot` carries `inputHash` (hash of assessment) and
  `methodologyHash` (hash of `MethodologyBundle`).
- These hashes enable replay verification: recompute from source inputs and
  confirm the output hash matches.

---

## 4. Build vs Runtime Rules

### 4.1 Build Environment (`next build`)

The build environment must **not** access:

- Database (no `PrismaClient` calls)
- Object storage
- Auth/session verification
- Scoring engine invocation

Any page that requires these must be **runtime rendered**.

### 4.2 Runtime Environment

The runtime environment **may** access:

- Database via API routes and server components
- Snapshot construction and persistence
- Engine invocation (via orchestrators only)
- Auth and session verification

### 4.3 Next.js Rendering Rules

**Must be runtime rendered** (`dynamic = "force-dynamic"` or equivalent):

- `/operator/onboarding`
- `/operator/dashboard`
- `/operator/evidence`
- `/admin/dashboard`
- `/admin/evidence`
- `/traveler/dashboard`
- Any page reading from the database or session

**May be statically generated:**

- `/(public)` — landing, discover, methodology, pricing
- Marketing pages

---

## 5. ESLint Enforcement

Restricted import rules in `eslint.config.mjs` prevent frontend modules from
importing backend-only modules:

| Forbidden Import (in frontend) | Reason |
|---|---|
| `@/lib/engine/trt-scoring-engine` | Scoring authority violation |
| `@/lib/snapshots/*` | Snapshot construction authority |
| `@/lib/methodology/*` | Methodology access authority |
| `@/lib/orchestration/*` | Orchestrator access authority |
| `@/lib/db/*` | Database access violation |
| `@prisma/client` | Database access violation |

These rules apply to files matching:

- `src/components/**`
- `src/hooks/**`
- `src/store/**`
- `src/app/**/page.tsx` (client pages)
- Any file with `"use client"`

---

## 6. Golden Test Vectors

The `engine/__tests__/golden-vectors.test.ts` file contains known-good
input/output pairs. CI must fail if any golden output changes.

Additional golden vector fixtures live in
`engine/tests/golden-vectors/` as JSON files for external tooling
and cross-language validation.

---

*Architecture Guardrails v1.0 · April 2026 · TRT Platform*
