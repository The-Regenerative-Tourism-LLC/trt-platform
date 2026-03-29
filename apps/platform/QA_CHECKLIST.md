# TRT Platform — Manual QA Checklist

> Pre-production validation · March 2026

## 1. Operator Lifecycle

- [ ] **1.1** Create operator account via `/signup` with email/password
- [ ] **1.2** Select "operator" role on `/select-role`
- [ ] **1.3** Navigate to `/operator/dashboard` — empty state shown
- [ ] **1.4** Click "Start Assessment" → redirects to `/operator/onboarding`
- [ ] **1.5** Complete multi-step onboarding form (verify all steps save)
- [ ] **1.6** Submit assessment → ScoreSnapshot created
- [ ] **1.7** Verify ScoreSnapshot starts with `isPublished: false`
- [ ] **1.8** Verify `publicationBlockedReason` is set (e.g. "Pending T1 evidence verification")
- [ ] **1.9** Navigate to `/operator/evidence` — upload evidence form works
- [ ] **1.10** Submit T1 evidence → EvidenceRef created with `verificationState: pending`
- [ ] **1.11** Verify GPS score visible on operator dashboard (private)
- [ ] **1.12** Verify public page `/operators/{id}` returns 404 (score not published yet)
- [ ] **1.13** Admin verifies T1 evidence → score becomes published
- [ ] **1.14** Verify `/operators/{id}` now shows the published score
- [ ] **1.15** Verify all score values on public page match the persisted ScoreSnapshot

## 2. Evidence Lifecycle

- [ ] **2.1** Operator uploads T1 evidence → state is `pending`
- [ ] **2.2** Admin navigates to `/admin/evidence` → evidence appears in queue
- [ ] **2.3** Admin clicks "Verify" → state becomes `verified`
- [ ] **2.4** Admin clicks "Reject" → state becomes `rejected`
- [ ] **2.5** After all T1 verified → linked ScoreSnapshot `isPublished` flips to `true`
- [ ] **2.6** Upload T3 evidence → state is `pending`
- [ ] **2.7** Verify T3 → P3 eligibility gated correctly in next scoring run
- [ ] **2.8** Without verified T3 → P3 score = 0 (T3 gate enforced by orchestrator)
- [ ] **2.9** Audit log entries created for each evidence action

## 3. Cycle 2 / DPS Lifecycle

- [ ] **3.1** Complete Cycle 1 assessment → ScoreSnapshot persisted
- [ ] **3.2** Publish Cycle 1 score (via T1 verification)
- [ ] **3.3** Start Cycle 2 assessment for same operator
- [ ] **3.4** Verify `assessmentCycleCount` increments correctly
- [ ] **3.5** Verify orchestrator loads baseline from Cycle 1 ScoreSnapshot (not client)
- [ ] **3.6** Verify DeltaBlock is constructed with DB-sourced baselineScores
- [ ] **3.7** Verify DPS-1, DPS-2, DPS-3 are computed
- [ ] **3.8** Verify DPS total is added directly to GPS (not scaled)
- [ ] **3.9** Verify DPS displayed on operator dashboard
- [ ] **3.10** Verify DPS displayed on public Green Passport page

## 4. Type C Operator Scenario

- [ ] **4.1** Create Type C operator in onboarding
- [ ] **4.2** Enter valid revenue split (e.g. 70/30) → accepted
- [ ] **4.3** Enter invalid revenue split (e.g. 80/10) → rejected with error message
- [ ] **4.4** Submit Type C assessment → score computed with blended P2/P3
- [ ] **4.5** Verify revenue split values persisted on AssessmentSnapshot

## 5. Permissions / Roles

- [ ] **5.1** Unauthenticated user can view `/discover`, `/operators`, `/methodology`
- [ ] **5.2** Unauthenticated user redirected from `/operator/dashboard` to `/login`
- [ ] **5.3** Unauthenticated user redirected from `/admin/dashboard` to `/login`
- [ ] **5.4** Operator cannot access `/admin/dashboard` → redirected to operator dashboard
- [ ] **5.5** Traveler cannot access `/operator/dashboard` → redirected to traveler dashboard
- [ ] **5.6** Admin can access all role-scoped routes
- [ ] **5.7** `POST /api/v1/admin/evidence/[id]/verify` rejects non-admin users
- [ ] **5.8** `POST /api/v1/score` rejects unauthenticated requests
- [ ] **5.9** `POST /api/v1/score` rejects operator scoring another operator's profile
- [ ] **5.10** `POST /api/v1/evidence` rejects operator uploading to another's snapshot

## 6. Public Pages / Routing

- [ ] **6.1** Landing page `/` renders correctly
- [ ] **6.2** `/discover` renders operator listing with scores from DB
- [ ] **6.3** `/destinations` renders correctly
- [ ] **6.4** `/methodology` renders correctly
- [ ] **6.5** `/operators` renders with published operators and scores
- [ ] **6.6** `/operators/{id}` renders Green Passport for published operator
- [ ] **6.7** `/pricing` renders correctly
- [ ] **6.8** `/leaderboard` renders "coming soon" placeholder
- [ ] **6.9** All navbar links resolve to existing pages
- [ ] **6.10** No broken `href` links across public pages
- [ ] **6.11** Footer links resolve correctly
- [ ] **6.12** Mobile navigation works on all pages

## 7. Traveler Flows

- [ ] **7.1** Create traveler account → redirected to `/traveler/dashboard`
- [ ] **7.2** Traveler dashboard renders
- [ ] **7.3** `/traveler/discover` renders operator discovery
- [ ] **7.4** Traveler can view public operator pages
- [ ] **7.5** Check-in flow — verify if implemented or stub
- [ ] **7.6** Badges / points system — verify if implemented or stub

## 8. Admin Flows

- [ ] **8.1** Admin dashboard `/admin/dashboard` renders with stats
- [ ] **8.2** Evidence review queue `/admin/evidence` shows pending evidence
- [ ] **8.3** Verify evidence → status updates, audit log created
- [ ] **8.4** Reject evidence → status updates, audit log created
- [ ] **8.5** T1 verification triggers ScoreSnapshot publication
- [ ] **8.6** All admin actions are audit logged
- [ ] **8.7** Admin can navigate between dashboard and evidence queue

## 9. Data Integrity

- [ ] **9.1** Public pages display data from persisted ScoreSnapshot (not computed)
- [ ] **9.2** AssessmentSnapshot is never updated after creation
- [ ] **9.3** ScoreSnapshot only changes `isPublished` / `publicationBlockedReason`
- [ ] **9.4** ForwardCommitmentRecord created when P3 Status = D
- [ ] **9.5** Methodology version recorded on every ScoreSnapshot
- [ ] **9.6** Snapshot hashes are populated and consistent

---

*QA Checklist v1.0 · Generated March 2026*
