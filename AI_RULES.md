# AI Rules — TRT Platform

Rules for AI assistants (Cursor, Copilot, Claude, etc.) modifying this repository.

These rules are non-negotiable. Violating them will break scoring integrity,
audit compliance, and the platform's trust model.

---

## 1. Scoring Authority

The **TRT Scoring Engine** (`lib/engine/trt-scoring-engine/`) is the **sole scoring
authority** in the entire platform.

- GPS, DPS, DPI, band classification, indicator normalisation, delta calculations,
  and weight application are computed **only** by the engine.
- No other module, component, service, or route may replicate, approximate, or
  re-derive any score.
- The engine is invoked **exclusively** through the Scoring Orchestrator
  (`lib/orchestration/scoring-orchestrator.ts`).

## 2. Frontend Restrictions

Frontend code (React components, pages, hooks, Zustand stores, TanStack Query) **may**:

- Collect form data from the operator.
- Display `ScoreSnapshot` data returned by API routes.
- Display preview scores returned by `POST /api/v1/score/preview`.
- Upload evidence via API.
- Display progress and UI state.

Frontend code **must NOT**:

- Compute or approximate GPS, DPS, DPI, or pillar scores.
- Import the scoring engine (`@/lib/engine/trt-scoring-engine`).
- Import snapshot builders (`@/lib/snapshots/*`).
- Import the `MethodologyBundle` or `default-bundle.ts`.
- Import `@prisma/client` or `@/lib/db/prisma`.
- Construct `AssessmentSnapshot`, `DpiSnapshot`, or `ScoreSnapshot` objects.
- Access the database directly.
- Access object storage directly.

## 3. Snapshot Immutability

All snapshots are **immutable, append-only** records:

- `AssessmentSnapshot` — immutable once persisted.
- `DpiSnapshot` — immutable once persisted.
- `ScoreSnapshot` — immutable once persisted.
- `PostTripReport` — immutable once persisted.

**Never** update or delete a snapshot row. New assessments create new snapshot rows.
Historical scores must be reproducible indefinitely from their source inputs.

## 4. Snapshot Construction

Snapshots may **only** be constructed in:

- API routes (`app/api/`)
- Orchestrators (`lib/orchestration/`)
- Snapshot builders (`lib/snapshots/`)

Snapshots must **never** be constructed in:

- React components
- Client components
- Hooks
- Stores
- Static pages

## 5. Deterministic Scoring Engine

The engine is a **pure function**: `(AssessmentSnapshot, DpiSnapshot, MethodologyBundle) → ScoreSnapshot`.

The engine must **never**:

- Access the database.
- Access environment variables.
- Make network calls.
- Perform file I/O.
- Use `Date.now()` or system time.
- Infer values not present in the provided inputs.

Identical inputs must always produce identical outputs.

## 6. Database Access Rules

Database access (Prisma) is **allowed only** in:

- API routes (`app/api/`)
- Runtime server components
- Background workers
- Repositories (`lib/db/repositories/`)

Database access is **forbidden** in:

- Static generation / `generateStaticParams()`
- Client components (`"use client"`)
- The scoring engine
- Snapshot builders (they receive data, not query for it)
- Frontend hooks or stores

## 7. Build vs Runtime Environment

**Build environment** (Next.js build / `next build`):

- No database access
- No object storage access
- No auth verification
- No scoring engine invocation

**Runtime environment** (server-side request handling):

- Database access allowed (API routes, server components)
- Snapshot construction allowed
- Engine invocation allowed (via orchestrator only)
- Auth verification allowed

## 8. Next.js Rendering Strategy

**Runtime rendered** (must use `export const dynamic = "force-dynamic"` or equivalent):

- Onboarding pages
- Operator dashboard
- Booking flow
- Admin pages
- Traveler dashboard

**Static allowed** only for:

- Marketing pages (`(public)/`)
- Methodology documentation
- Landing pages

## 9. Evidence Storage vs Snapshot Meaning

- **Evidence files** (PDFs, images) live in object storage. Only checksums and
  metadata are persisted in the database via `EvidenceRef`.
- **Snapshots** capture the assessed values at a point in time. They reference
  evidence by `indicatorId` + `checksum`, never by file bytes.
- Evidence verification state (`pending` → `verified` | `rejected` | `lapsed`)
  is tracked separately from scoring. A score computed with `pending` evidence
  is valid; the T3 gate applies only to publication eligibility.

## 10. Onboarding Restrictions

- Onboarding UI collects **raw input data** only (kWh, litres, FTE counts, etc.).
- Derived indicators (energy intensity, water intensity, employment rates) are
  computed **server-side** in API routes, never in frontend code.
- The `usePreviewScore` hook calls `POST /api/v1/score/preview` — it does not
  contain scoring logic.
- The onboarding store (`store/onboarding-store.ts`) holds UI state only.

## 11. Authority Boundaries Summary

| Layer | May Do | Must Not Do |
|---|---|---|
| Frontend | Collect data, display scores, upload evidence | Compute scores, access DB |
| API Routes | Validate, orchestrate, persist | Contain scoring formulas |
| Orchestrators | Build snapshots, invoke engine, persist results | Be called from frontend |
| Scoring Engine | Compute GPS/DPS/DPI/bands | Access DB, network, env, time |
| Repositories | CRUD on database tables | Contain business logic |
| Snapshot Builders | Construct + hash snapshots | Query the database |

---

*These rules apply to all contributors — human and AI.*
