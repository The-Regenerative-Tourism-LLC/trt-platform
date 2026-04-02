# Database — Data Access Layer

This directory contains the Prisma client singleton and repository modules
for all database operations.

## Authority Boundary

| Allowed | Forbidden |
|---|---|
| Expose Prisma client singleton | Contain business logic |
| Provide repository functions for CRUD | Contain scoring formulas |
| Enforce data access patterns | Be imported in client components |
| Read and write to PostgreSQL | Be imported in the scoring engine |
| | Be used during static generation |

## Files

- `prisma.ts` — Prisma client singleton (global cache for dev hot-reload)
- `repositories/` — One repository per domain entity:
  - `operator.repo.ts`
  - `assessment.repo.ts`
  - `score.repo.ts`
  - `dpi.repo.ts`
  - `territory.repo.ts`
  - `evidence.repo.ts`
  - `onboarding-draft.repo.ts`
  - `forward-commitment.repo.ts`

## Access Rules

Database access is **allowed only** in:

- API routes (`app/api/`)
- Runtime server components
- Background workers
- Orchestrators (`lib/orchestration/`)
- Repository modules (this directory)

Database access is **forbidden** in:

- Client components (`"use client"`)
- Static generation (`generateStaticParams()`)
- The scoring engine (`lib/engine/`)
- Snapshot builders (`lib/snapshots/`)
- Frontend hooks (`hooks/`)
- Zustand stores (`store/`)

## Append-Only Constraints

The following tables are **append-only** — rows must never be updated or deleted:

- `assessment_snapshots`
- `dpi_snapshots`
- `score_snapshots`
- `evidence_refs`
- `audit_events`

## Interaction Rules

- **Imported by:** API routes, orchestrators, server components
- **Never imported by:** Client components, hooks, stores, scoring engine
- **Depends on:** `@prisma/client` (generated from `prisma/schema.prisma`)
