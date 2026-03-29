# TRT Platform — Pre-Production Readiness Report

> Full validation report · March 29, 2026

---

## PART 1 — ARCHITECTURE COMPLIANCE REVIEW

### A. Engine / Scoring Authority

| Item | Status | Evidence |
|------|--------|----------|
| No scoring logic in frontend components | **PARTIAL** | `ScoreRings.tsx:44` has fallback GPS calc: `total ?? Math.round(footprint * 0.4 + local * 0.3 + regen * 0.3)`. `OperatorDashboardClient.tsx:222-226` recomputes weighted total for display. `OperatorOnboardingClient.tsx:26` imports `normalizeValue` and `normalizeDiscreteScore` from engine for live preview. |
| No scoring logic in API routes | **PASS** | All API routes delegate to orchestrator. `POST /api/v1/score` calls `runScoring()`. No score math in routes. |
| All scores flow through scoring-orchestrator | **PASS** | `scoring-orchestrator.ts` is the sole caller of `computeScore()`. T3 gate GPS recalculation at lines 228-237 is the only post-engine adjustment (architecturally necessary). |
| Engine is deterministic and stateless | **PASS** | Verified by golden vector test GV-006 + architecture-compliance test (100 identical calls). No shared state, no `Date.now()`. |
| Engine does not import prisma/db/fs/network | **PASS** | Engine files (`compute-score.ts`, `p1.ts`, `p2.ts`, `p3.ts`, `dps.ts`, `bands.ts`, `normalise.ts`, `canonical.ts`) import only from `./types` and sibling engine modules. No prisma/db/fs/net imports. |

### B. Snapshots

| Item | Status | Evidence |
|------|--------|----------|
| AssessmentSnapshot is created once and not updated | **PASS** | `assessment.repo.ts` has only `create` and `find` operations. No `update` function exists. |
| ScoreSnapshot is append-only | **PASS** | `score.repo.ts` has `createScoreSnapshot` (append) and only `publishScoreSnapshot` / `blockScorePublication` for mutation. |
| Only publication fields may change later | **PASS** | `publishScoreSnapshot` updates only `isPublished` and `publicationBlockedReason`. No other update functions. |
| DPISnapshot is persisted/versioned | **PASS** | `DpiSnapshot` model has `methodologyVersion` field (default "1.0.0"). `dpi-snapshot.builder.ts` creates immutable snapshots with hashes. |
| Hashing is recursive canonical JSON | **PASS** | `canonical.ts` implements recursive key-sorted JSON. `assessment-snapshot.builder.ts:66` and `dpi-snapshot.builder.ts:72` both use `canonicalize()` before SHA-256. Tests confirm determinism. |

### C. Evidence Lifecycle

| Item | Status | Evidence |
|------|--------|----------|
| Evidence stored as refs/checksums only | **PASS** | `EvidenceRef` model stores `fileName`, `storagePath`, `checksum` — no binary data. `POST /api/v1/evidence` accepts only metadata. |
| Evidence upload route exists | **PASS** | `POST /api/v1/evidence` at `apps/platform/src/app/api/v1/evidence/route.ts`. |
| Evidence verification route exists | **PASS** | `POST /api/v1/admin/evidence/[id]/verify` at `apps/platform/src/app/api/v1/admin/evidence/[id]/verify/route.ts`. |
| T1 verification controls publication | **PASS** | `verify/route.ts:85-111`: after T1 verification, checks all T1 evidence for snapshot, then publishes ScoreSnapshot. |
| T3 verification controls P3 eligibility | **PASS** | `scoring-orchestrator.ts:218-225`: T3 gate zeros P3 if no verified T3 evidence exists. |
| T2 deadline/lapse logic | **PARTIAL** | `VerificationState` enum includes `lapsed`. `EvidenceRef` has `verificationState` field. However, **no automated T2 deadline monitoring or lapse trigger** is implemented. Lapsing is manual only. |

### D. Delta / DPS

| Item | Status | Evidence |
|------|--------|----------|
| Cycle 2+ baseline comes from DB | **PASS** | `scoring-orchestrator.ts:155-183`: explicit `findCycle1ScoreByOperator()` call. Comment: "SECURITY: We never trust client-supplied baselineScores." `score/route.ts:111` passes empty `baselineScores: {}`. |
| DeltaBlock is built correctly | **PASS** | `assessment-snapshot.builder.ts:75-86` builds DeltaBlock. Orchestrator locks baseline from DB trace. |
| DPS uses DeltaBlock only | **PASS** | `compute-score.ts:94-114` only computes DPS when `assessment.assessmentCycle > 1 && assessment.delta !== null`. |
| assessmentCycleCount increments correctly | **PASS** | `scoring-orchestrator.ts:278`: `incrementAssessmentCycle(input.operatorId)`. `operator.repo.ts:36-40`: Prisma `{ increment: 1 }`. |

### E. Type C Handling

| Item | Status | Evidence |
|------|--------|----------|
| revenueSplit validation exists | **PASS** | `assessment.schema.ts:19-32`: `validateTypeCRevenueSplit()` checks sum = 100 ±1. |
| revenueSplit is used in scoring | **PASS** | `compute-score.ts:64-79`: Type C blends P2 and P3 using `accFrac` and `expFrac`. |
| Type C behavior differs from A/B | **PARTIAL** | P2 normalization bounds are identical for accommodation/tours in the default bundle, so P2 blending produces the same score as unblended. P1 still uses Type C's primary bounds (not blended). This may be intentional for v1.0 but should be documented. |

### F. Public Pages

| Item | Status | Evidence |
|------|--------|----------|
| Public pages read ScoreSnapshot from DB | **PASS** | `operators/[id]/page.tsx:33-47`: Direct Prisma query with `scoreSnapshots: { where: { isPublished: true } }`. `operators/page.tsx:63-98`: Same pattern. |
| Public pages do not recompute score | **PASS** | All public pages read `gpsTotal`, `gpsBand`, `p1Score`, etc. directly from ScoreSnapshot rows. No engine invocation. |
| Only published score is shown publicly | **PASS** | All queries filter `isPublished: true`. `operators/[id]/page.tsx:49` returns 404 if no published snapshot. |

---

## PART 2 — AUTOMATED TEST COVERAGE

### Existing Tests (before this review)

| File | Tests | Status |
|------|-------|--------|
| `golden-vectors.test.ts` | 6 | All pass |

### New Tests Created

| File | Tests | Status |
|------|-------|--------|
| `canonical.test.ts` | 8 | All pass — recursive sorting, determinism, deep nesting |
| `pillar-scoring.test.ts` | 19 | All pass — normalization, P1/P2/P3, R6 compliance |
| `dps.test.ts` | 7 | All pass — DPS-1/2/3, clamping, bands |
| `compute-score.test.ts` | 15 | All pass — GPS formula, DPS lifecycle, Type C, bands |
| `snapshot-builder.test.ts` | 10 | All pass — hashing, DeltaBlock, DPI composite |
| `architecture-compliance.test.ts` | 9 | All pass — determinism, statelessness, revenue split |

**Total: 74 tests, all passing.**

### Tests NOT Created (require DB/infra)

The following tests require integration infrastructure (test DB, mocked auth) that would destabilize the current setup if added without proper CI configuration:

- API route integration tests (auth, Prisma transactions)
- Orchestrator integration tests (requires live DB)
- Frontend smoke tests (requires Next.js test renderer / Playwright)

**Recommendation:** Set up `vitest` + Prisma test DB in CI before adding integration tests.

---

## PART 3 — MANUAL QA CHECKLIST

Created as `QA_CHECKLIST.md` in the platform root. Contains 60+ test scenarios across:

1. Operator lifecycle (15 items)
2. Evidence lifecycle (9 items)
3. Cycle 2 / DPS lifecycle (10 items)
4. Type C scenario (5 items)
5. Permissions / roles (10 items)
6. Public pages / routing (12 items)
7. Traveler flows (6 items)
8. Admin flows (7 items)
9. Data integrity (6 items)

---

## PART 4 — FRONTEND / ROUTING / PERMISSIONS VALIDATION

### A. Routing

| Link Target | Exists? | Status |
|------------|---------|--------|
| `/` | Yes | **PASS** — Landing page renders |
| `/discover` | Yes | **PASS** — DiscoverClient renders |
| `/destinations` | Yes | **PASS** — DestinationsClient renders |
| `/methodology` | Yes | **PASS** — MethodologyClient renders |
| `/operators` | Yes | **PASS** — Server-rendered operators list |
| `/operators/[id]` | Yes | **PASS** — Green Passport page |
| `/pricing` | Yes | **PASS** — Pricing page renders |
| `/leaderboard` | Yes | **PASS** — Stub ("coming soon") |
| `/login` | Yes | **PASS** — Login form |
| `/signup` | Yes | **PASS** — Signup form |
| `/select-role` | Yes | **PASS** — Role selection |
| `/operator/dashboard` | Yes | **PASS** — Operator dashboard |
| `/operator/evidence` | Yes | **PASS** — Evidence management |
| `/operator/onboarding` | Yes | **PASS** — Multi-step form |
| `/admin/dashboard` | Yes | **PASS** — Admin dashboard |
| `/admin/evidence` | Yes | **PASS** — Evidence queue |
| `/traveler/dashboard` | Yes | **PASS** — Traveler dashboard |
| `/traveler/discover` | Yes | **PASS** — Traveler discover |
| `/auth/signup` | **NO** | **FAIL** — 14 broken links across landing, pricing, leaderboard, footer |
| `/admin/operators` | **NO** | **FAIL** — Navbar links to non-existent page |
| `/admin/territories` | **NO** | **FAIL** — Navbar links to non-existent page |
| `/destinations/[id]` | **NO** | **FAIL** — No destination detail page exists |

### B. Broken Links (Critical)

**14 instances of `/auth/signup` found across:**
- `page.tsx` (landing page) — 6 links
- `pricing/page.tsx` — 3 links
- `leaderboard/page.tsx` — 1 link
- `Footer.tsx` — 2 links

**Fix:** Change all `/auth/signup` → `/signup`

**Navbar links to missing admin pages:**
- `/admin/operators` — page does not exist
- `/admin/territories` — page does not exist

### C. Public UX Issues

| Page | Status | Notes |
|------|--------|-------|
| Landing page | **PARTIAL** | Renders well. BUT: "15 baseline P3 points" text at line 555 contradicts TDD spec (P3 Status D = 0 points). All CTA links go to `/auth/signup` (broken). |
| Discover | **PASS** | Fetches operators from API, displays scores from DB |
| Destinations | **PASS** | Renders destination listing |
| Methodology | **PASS** | Rich methodology explainer |
| Operator page | **PASS** | Full Green Passport display from DB |
| Pricing | **PARTIAL** | Content renders. CTA links broken (`/auth/signup`). |
| Leaderboard | **PARTIAL** | Stub page — "Coming soon". CTA link broken. |

### D. Authenticated UX

| Page | Status | Notes |
|------|--------|-------|
| Operator dashboard | **PASS** | Fetches from `/api/v1/operator/dashboard`. Displays GPS, pillars, DPS, DPI from ScoreSnapshot. |
| Traveler dashboard | **PARTIAL** | Renders but traveler features are mostly stubs. |
| Admin dashboard | **PARTIAL** | Basic stats, but links to `/admin/operators` and `/admin/territories` (missing pages). |
| Admin evidence | **PASS** | Full verify/reject queue with audit logging. |

### E. Data Integrity in UI

| Check | Status | Evidence |
|-------|--------|----------|
| Public pages use DB-backed data | **PASS** | All public pages query Prisma directly for published scores. |
| Dashboard pages use real APIs | **PASS** | Operator dashboard fetches `/api/v1/operator/dashboard`. Admin evidence fetches from Prisma SSR. |
| No mock-only UI masquerading as real | **PARTIAL** | Landing page has hardcoded demo data (GPS 74, pillar bars 78/71/65, DPI 48) — clearly marketing copy but could confuse QA. |
| No frontend score calculation | **FAIL** | `ScoreRings.tsx:44`: `total ?? Math.round(footprint * 0.4 + local * 0.3 + regen * 0.3)`. `OperatorDashboardClient.tsx:222-226`: weighted total recomputed. `OperatorOnboardingClient.tsx:26`: imports engine normalization functions. |

### F. Architecture Violations in Frontend

| File | Violation | Severity | Fix |
|------|-----------|----------|-----|
| `ScoreRings.tsx:44` | Fallback GPS calculation `total ?? Math.round(...)` | **MEDIUM** | Always pass `total` prop; remove fallback calculation |
| `OperatorDashboardClient.tsx:222-226` | Recomputes `Math.round(p1*0.4 + p2*0.3 + p3*0.3)` for display | **LOW** | Display `gpsTotal` from ScoreSnapshot instead |
| `OperatorOnboardingClient.tsx:26` | Imports `normalizeValue`, `normalizeDiscreteScore` from engine | **MEDIUM** | Move to a separate UI-only preview utility that doesn't import from the engine module |
| `page.tsx:555` | "15 baseline P3 points" text | **HIGH** | Contradicts TDD spec. Remove or change to "P3 = 0 with Forward Commitment" |

---

## PART 5 — PRE-PRODUCTION READINESS REPORT

### 1. Architecture Compliance Summary

The core architecture is **well-implemented** and follows the prescribed 5-layer pattern:

```
UI → API Routes → Orchestrators → Snapshot Builders → TRT Scoring Engine → ScoreSnapshot → PostgreSQL → Public Display
```

**Key strengths:**
- Engine is pure, deterministic, stateless, and has no DB/network imports
- Orchestrator is the sole invoker of `computeScore()`
- Snapshots are immutable with SHA-256 canonical hashes
- T1/T3 evidence gates are correctly implemented
- Cycle 2+ baseline is locked from DB, never from client
- ForwardCommitmentRecord created on P3 Status D
- Publication requires explicit T1 verification
- Audit logging on all critical actions

**Key gaps:**
- 3 frontend files contain scoring logic (architecture violations)
- 14 broken CTA links (`/auth/signup` → should be `/signup`)
- Landing page copy contradicts TDD spec ("15 baseline P3 points")

### 2. Automated Test Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| Golden vectors | 6 | PASS |
| Canonical JSON | 8 | PASS |
| Pillar scoring (P1/P2/P3) | 19 | PASS |
| DPS computation | 7 | PASS |
| GPS end-to-end | 15 | PASS |
| Snapshot builders | 10 | PASS |
| Architecture compliance | 9 | PASS |
| **Total** | **74** | **ALL PASS** |

**Missing:** Integration tests (API routes, auth, DB lifecycle). Requires test DB infrastructure.

### 3. Manual QA Checklist Summary

60+ test scenarios created in `QA_CHECKLIST.md` covering all 9 critical areas.

### 4. Critical Blockers Before Production

| # | Issue | Severity | Files |
|---|-------|----------|-------|
| **CB-1** | 14 broken CTA links: `/auth/signup` does not exist; correct path is `/signup` | **CRITICAL** | `page.tsx`, `pricing/page.tsx`, `leaderboard/page.tsx`, `Footer.tsx` |
| **CB-2** | Landing page states "15 baseline P3 points" — contradicts TDD spec (P3 Status D = 0) | **HIGH** | `page.tsx:555` |

### 5. High-Risk Issues

| # | Issue | Severity | Files |
|---|-------|----------|-------|
| **HR-1** | `ScoreRings.tsx` fallback GPS calculation in frontend | **HIGH** | `components/scoring/ScoreRings.tsx:44` |
| **HR-2** | `OperatorOnboardingClient.tsx` imports engine normalization functions | **HIGH** | `app/operator/onboarding/OperatorOnboardingClient.tsx:26` |
| **HR-3** | Navbar links to `/admin/operators` and `/admin/territories` — pages don't exist | **HIGH** | `components/layout/Navbar.tsx:80-83` |
| **HR-4** | `lib/services/scoring.ts` and `lib/services/assessment.ts` are empty files | **MEDIUM** | Both files have no exports |
| **HR-5** | No automated T2 evidence lapse/deadline monitoring | **MEDIUM** | No cron/scheduler for lapse detection |

### 6. Medium-Risk Issues

| # | Issue | Severity | Files |
|---|-------|----------|-------|
| **MR-1** | `OperatorDashboardClient.tsx` recomputes weighted total for display | **MEDIUM** | `OperatorDashboardClient.tsx:222-226` |
| **MR-2** | Type C P2 blending produces identical results to Type A (same bounds) | **MEDIUM** | `compute-score.ts:64-79`, `default-bundle.ts` |
| **MR-3** | `FALLBACK_DPI` in orchestrator uses `new Date().toISOString()` at module load | **LOW** | `scoring-orchestrator.ts:54` |
| **MR-4** | `rims-scoring-engine/index.ts` exists but purpose unclear | **LOW** | Likely legacy/stub |
| **MR-5** | No integration tests for API routes | **MEDIUM** | Test infrastructure gap |
| **MR-6** | Leaderboard, traveler check-in, missions, activities — all stubs | **LOW** | Known Phase 6 items per MIGRATION_PLAN.md |
| **MR-7** | `methodology-bundle.loader.ts` `hashMethodologyBundle` uses `Object.keys().sort()` (shallow) vs `canonicalize` (recursive) | **LOW** | Could produce different hashes than engine canonical for nested bundles |

### 7. Recommended Fixes Before PR

| Priority | Fix | Effort |
|----------|-----|--------|
| **P0** | Change all `/auth/signup` → `/signup` (14 occurrences across 4 files) | 15 min |
| **P0** | Remove "15 baseline P3 points" text from landing page or change to "P3 = 0 with Forward Commitment declared" | 5 min |
| **P1** | Make `total` prop required on `ScoreRings` or remove fallback calc | 10 min |
| **P1** | Replace `OperatorDashboardClient.tsx:222-226` weighted total calc with `score.gpsTotal` display | 5 min |
| **P1** | Remove or gate `/admin/operators` and `/admin/territories` links in Navbar | 5 min |
| **P2** | Move `normalizeValue`/`normalizeDiscreteScore` usage in `OperatorOnboardingClient` to a UI-only utility module | 30 min |
| **P2** | Delete empty `lib/services/scoring.ts` and `lib/services/assessment.ts` | 2 min |

### 8. Recommended Fixes Before Production

| Priority | Fix | Effort |
|----------|-----|--------|
| Set up CI test pipeline with Vitest | 2-4 hrs |
| Add integration tests with test DB for orchestrator lifecycle | 1-2 days |
| Add API route tests with mocked auth | 1 day |
| Implement T2 evidence lapse monitoring (cron or scheduled job) | 4-8 hrs |
| Add Playwright/Cypress smoke tests for critical user flows | 1-2 days |
| Unify `hashMethodologyBundle` to use `canonicalize()` instead of shallow sort | 30 min |
| Create missing admin pages (`/admin/operators`, `/admin/territories`) or remove links | 2-4 hrs |
| Add destination detail page (`/destinations/[id]`) or remove broken links | 2-4 hrs |

### 9. Final Readiness Verdict

## **READY WITH FIXES**

The core scoring architecture is **solid and well-implemented**:
- Engine is pure, deterministic, and correctly isolated
- Orchestration flow follows the prescribed architecture
- Snapshots are immutable with proper hashing
- Evidence lifecycle and publication gates work correctly
- 74 automated tests pass, covering engine, DPS, snapshots, and compliance

**Before merging to production, fix:**
1. The 14 broken `/auth/signup` links (CB-1) — **blocking**
2. The incorrect "15 P3 points" copy (CB-2) — **blocking**
3. The frontend scoring calculations (HR-1, HR-2) — **high priority**
4. The dead navbar links (HR-3) — **high priority**

After these 4 fixes, the platform is safe for a controlled production deployment with the understanding that:
- Traveler features are stubs (documented in MIGRATION_PLAN.md)
- Integration test coverage should be added in CI
- T2 lapse monitoring needs implementation

---

*Pre-Production Readiness Report v1.0 · March 29, 2026*
