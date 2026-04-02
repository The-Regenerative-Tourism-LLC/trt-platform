# Validation — Zod Schemas & Input Verification

This directory contains Zod schemas that validate snapshot structures,
API request bodies, and assessment inputs.

## Authority Boundary

| Allowed | Forbidden |
|---|---|
| Define Zod schemas for data validation | Contain scoring logic |
| Validate request payloads | Compute derived values |
| Export inferred TypeScript types | Access the database |
| Validate Type C revenue split constraints | |

## Files

- `snapshot.schema.ts` — `DpiSnapshotSchema`, `ScoreSnapshotSchema`
- `assessment.schema.ts` — Assessment input validation, Type C revenue split

## Interaction Rules

- **Imported by:** API routes, orchestrators, tests
- **May be imported by:** Frontend (for client-side form validation only)
- **Never contains:** Scoring formulas, weight constants, normalisation logic
