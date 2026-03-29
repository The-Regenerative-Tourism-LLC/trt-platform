# TRT Platform — Lovable Migration Plan

> Version 1.0 · March 2026 · For Developer Use

This document maps all Lovable app features to the official Next.js platform architecture and defines the phased implementation plan.

---

## 1. Codebase Comparison

### Next.js Platform (official)
- Next.js 16 App Router, TypeScript, Prisma/PostgreSQL, Auth.js v5
- TRT Scoring Engine (pure, deterministic, stateless)
- Strict 5-layer architecture: UI → API Routes → Snapshots → Engine → DB
- Railway deployment, Docker, EU region

### Lovable App (to migrate FROM)
- Vite SPA, React 18, Supabase, react-router-dom
- In-browser scoring engine with deviations from spec
- No server-side API route layer; direct Supabase queries from components
- 35 routes, 19-step onboarding, full traveler/admin/public flows

---

## 2. Architecture Deviations in Lovable (DO NOT PORT)

These patterns exist in Lovable but violate the TDD spec — do not replicate:

| Lovable Pattern | Why It Violates Spec | Correct Approach |
|---|---|---|
| `useOnboardingScoring` — live GPS in browser | Scoring logic in frontend (TDD §7) | Remove; live preview allowed but must call API |
| Evidence tier score multipliers (T1×1.0, T2×0.75, Proxy×0.25) | Not in spec; spec uses band reduction only | Use `proxyCorrectionFactor` per MethodologyBundle |
| Forward Commitment = 15 pts flat for P3 | Spec says P3=0 for Status D (TDD §6.2) | P3=0; FCR is a separate display artifact |
| DPS modifier = `clamp(dps × 0.4, -5, +10)` | Spec says DPS added directly to GPS (TDD §3.1) | DPS added directly, GPS clamped 0-100 |
| Piecewise linear interpolation (v1.1.0) | Spec uses stepped rubric bands 0/25/50/75/100 | Keep stepped bands |
| Direct Supabase queries from components | No DB access in frontend (TDD §7) | All data via API routes |

---

## 3. Feature Mapping (Lovable → Next.js)

### 3.1 Public / Marketing Pages

| Lovable Route | Status in Next.js | Action |
|---|---|---|
| `/` — Homepage | Stub exists | Port full hero, features, listings |
| `/methodology` — Methodology | Stub exists | Port full content/charts |
| `/operators` — Operator listing | Needs work | Port discovery UI |
| `/operators/:id` — Green Passport | Stub exists | Port full score display, map, gallery |
| `/destinations` — Destinations list | Stub exists | Port cards and DPI display |
| `/destinations/:id` — Destination detail | Missing | Create |
| `/pricing` — Pricing page | Missing | Create |
| `/partners` — Partners | Missing | Create |
| `/missions` — Missions catalogue | Missing | Create |
| `/missions/:slug` — Mission detail | Missing | Create |
| `/science/sdgs` — SDGs | Missing | Create |
| `/science/gstc` — GSTC | Missing | Create |

### 3.2 Auth Flows

| Feature | Status | Action |
|---|---|---|
| Email/password login | Done | Keep |
| Google OAuth | Done | Keep |
| Role selection post-signup | Done | Improve UX |
| Operator auto-profile create | Partial | Complete |
| Traveler auto-profile create | Partial | Complete |
| Redirect to correct dashboard | Done | Keep |

### 3.3 Operator Features

| Lovable Feature | Status in Next.js | Action |
|---|---|---|
| 19-step onboarding form | Stub exists | Port full multi-step form |
| Live score preview (floating card) | Missing | Port (call API, not compute in browser) |
| Evidence upload per indicator | Stub exists | Port upload UI + tier classification |
| Evidence verification status display | Missing | Create |
| Operator dashboard | Stub exists | Port metrics, QR code, assessment status |
| Analytics (profile views, bookings) | Missing | Create with ProfileView model |
| Recommendations report | Missing | Port AI improvement roadmap |
| Public profile editor | Missing | Create |
| Embed widget page | Missing | Create |
| Multi-property switching | Missing | Create |

### 3.4 Traveler Features

| Lovable Feature | Status in Next.js | Action |
|---|---|---|
| Discover (tab: Stays/Experiences/Partners) | Stub exists | Port full listing with filters |
| Compare operators (side-by-side) | Missing | Create |
| Leaderboard | Missing | Create |
| Traveler passport (impact history) | Stub exists | Port with levels/badges system |
| Traveler profile | Missing | Create |
| QR scan check-in | Missing | Create with CheckIn model |
| Pre-booking signal | Missing | Create with Booking model |
| Post-trip impact report | Missing | Create |
| Biodiversity missions | Missing | Create with BiodiversityMission model |
| Mission sightings (species photo) | Missing | Create with MissionSighting model |

### 3.5 Admin Features

| Lovable Feature | Status in Next.js | Action |
|---|---|---|
| Dashboard stats | Stub exists | Port full metrics |
| Operators list + detail | Stub exists | Port full management UI |
| Evidence review queue | Stub exists | Port approve/reject flow |
| Score management | Stub exists | Port publish/unpublish |
| Territory DPI management | Stub exists | Port with DPISnapshot creation |
| Sightings review queue | Missing | Create |

---

## 4. Missing Database Models

### 4.1 Operator Profile (extend existing model)

Fields to add to `Operator`:
- `tagline` String?
- `description` String? (long text)
- `coverPhotoUrl` String?
- `photos` String[] (gallery)
- `amenities` String[]
- `lat` Decimal?
- `lng` Decimal?
- `address` String?
- `isPublished` Boolean @default(false)
- `publicationBlockedReason` String?
- `qrCodeUrl` String?

### 4.2 New Models

| Model | Purpose |
|---|---|
| `CheckIn` | QR scan check-ins by travelers at operator locations |
| `Activity` | Activity/experience listings linked to operators |
| `ActivityRegistration` | Traveler signups for activities |
| `BiodiversityMission` | Citizen science mission configuration |
| `MissionSighting` | Traveler species sighting submissions (photo + GPS) |
| `MissionExploration` | Traveler location check-ins for missions |
| `TravelerBadge` | Earned badges per traveler |
| `OperatorReview` | Traveler reviews and ratings |
| `Notification` | In-app notifications |
| `ProfileView` | Operator profile view analytics |
| `TravelerWaitlist` | Email waitlist capture |

### 4.3 DpiSnapshot Enhancement

Add `methodologyVersion` field (required by spec).

---

## 5. Missing API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/v1/operators/[id]` | GET | Public operator profile with latest ScoreSnapshot |
| `/api/v1/operators/[id]/score-preview` | POST | Live score preview during onboarding |
| `/api/v1/operators/[id]/publish` | POST | Admin: publish operator score |
| `/api/v1/evidence/[id]/verify` | POST | Admin: verify/reject evidence |
| `/api/v1/evidence/[id]/upload` | POST | Operator: upload evidence file to object storage |
| `/api/v1/territories` | GET | List territories with DPI |
| `/api/v1/territories/[id]` | GET | Territory detail with DPI history |
| `/api/v1/travelers/[id]` | GET | Traveler profile |
| `/api/v1/travelers/[id]/bookings` | GET/POST | Booking management |
| `/api/v1/travelers/[id]/checkin` | POST | QR scan check-in |
| `/api/v1/missions` | GET | Biodiversity missions list |
| `/api/v1/missions/[id]/sightings` | POST | Submit species sighting |
| `/api/v1/admin/sightings` | GET | Admin sightings review queue |
| `/api/v1/admin/sightings/[id]/verify` | POST | Admin: verify/reject sighting |
| `/api/v1/notifications` | GET/PUT | User notifications |

---

## 6. Phased Implementation Plan

### PHASE 1 — Core Engine Integrity ✅ (in progress)

**Goal:** Ensure the scoring engine strictly conforms to TDD v4.0 and Scoring Engine Spec v1.0.

- [x] Audit engine against spec
- [ ] Fix R6 violation: remove premature `Math.round()` from p1/p2/p3/dps
- [ ] Fix GPS clamp order: `Math.round(clamp(...))` not `clamp(Math.round(...))`
- [ ] Add `canonicalize()` and `hashCanonical()` to engine exports
- [ ] Add `ComputeInput` / `ComputeOptions` interfaces (spec §6.2)
- [ ] Verify golden test vectors still pass
- [ ] Ensure DeltaBlock baseline_scores come from Cycle 1 ScoreSnapshot (not recomputed)

**Architecture Issues Found:**
- `p1.ts`, `p2.ts`, `p3.ts`: premature `Math.round()` on pillar scores → violates R6
- `dps.ts`: premature `Math.round()` on dpsTotal → violates R6
- `compute-score.ts`: `clamp(Math.round(...), 0, 100)` → clamp should come first

### PHASE 2 — Data Model Alignment ✅ (in progress)

**Goal:** Extend Prisma schema to cover all platform entities.

- [ ] Add operator public profile fields
- [ ] Add `CheckIn`, `Activity`, `ActivityRegistration` models
- [ ] Add `BiodiversityMission`, `MissionSighting`, `MissionExploration` models
- [ ] Add `TravelerBadge`, `OperatorReview`, `Notification`, `ProfileView` models
- [ ] Add `TravelerWaitlist` model
- [ ] Add `methodologyVersion` to `DpiSnapshot`
- [ ] Generate and apply migration

### PHASE 3 — Auth + User Provisioning

**Goal:** Robust auth flows with auto-profile creation.

- [ ] Improve Google OAuth onboarding (role selection step)
- [ ] Auto-create Operator profile on role assignment
- [ ] Auto-create Traveler profile on role assignment
- [ ] Email verification flow
- [ ] Middleware improvements for public vs authenticated routes

### PHASE 4 — Operator Features

**Goal:** Full operator onboarding and management portal.

- [ ] Multi-step onboarding form (19 steps, matching Assessment Form v3)
- [ ] Live score preview card (API-driven, not in-browser scoring)
- [ ] Evidence upload UI + tier classification
- [ ] Operator dashboard (assessment status, QR, score, DPI)
- [ ] Analytics page (profile views, bookings)
- [ ] Recommendations report
- [ ] Public profile editor (tagline, photos, description)
- [ ] Embed widget page

### PHASE 5 — Public Platform

**Goal:** Full public-facing site.

- [ ] Landing page (hero, features, example listings)
- [ ] Operators discovery listing
- [ ] Public Green Passport page (score rings, pillar breakdown, map, gallery)
- [ ] Destinations list + detail with DPI display
- [ ] Methodology explainer page
- [ ] Partners page
- [ ] Pricing page
- [ ] Missions catalogue

### PHASE 6 — Traveler Features

**Goal:** Full traveler portal with impact tracking.

- [ ] Discover page (Stays / Experiences / Partners tabs)
- [ ] Compare operators (side-by-side GPS/DPS/pillar)
- [ ] Traveler passport (levels, badges, history)
- [ ] QR scan check-in
- [ ] Pre-booking intent signal
- [ ] Post-trip impact report
- [ ] Biodiversity missions + sighting submission
- [ ] Traveler profile + public passport URL
- [ ] Leaderboard

### PHASE 7 — Admin / Backoffice

**Goal:** Full admin control panel.

- [ ] Dashboard with platform stats
- [ ] Operators management + detail view
- [ ] Evidence review queue (T1 approve/reject → auto-publish)
- [ ] Score management (publish/unpublish)
- [ ] Territory DPI management
- [ ] Sightings review queue

---

## 7. Success Criteria

- All scoring flows use the official TRT Scoring Engine
- All scores computed via AssessmentSnapshot → engine → ScoreSnapshot
- Evidence system works with T1/T2/T3 verification tiers
- Operator onboarding produces AssessmentSnapshot and ScoreSnapshot
- Public Green Passport renders from persisted ScoreSnapshot
- Traveler flows use GPS + DPI signals
- Admin can verify evidence and publish scores
- Auth and roles work for all user types
- Platform deploys to Railway production

---

## 8. Scoring Engine Deviations to Watch

When porting from Lovable, reject these patterns:

1. **No in-browser GPS computation** — onboarding preview must POST to `/api/v1/operators/[id]/score-preview`
2. **P3 Status D = P3 score 0** — not 15 points flat
3. **DPS added directly to GPS** — not scaled by 0.4
4. **Rubric bands 0/25/50/75/100** — not piecewise linear interpolation
5. **Evidence tier affects publication state** — not score multiplier
6. **Proxy reduces score by one band** — via `proxyCorrectionFactor` in MethodologyBundle

---

*TRT Platform Migration Plan · v1.0 · March 2026*
