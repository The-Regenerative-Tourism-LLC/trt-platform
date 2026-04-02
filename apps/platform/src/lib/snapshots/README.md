# Snapshots — Immutable Record Construction

This directory contains builders that construct **immutable, hash-verified
snapshots** from fully resolved input data.

## Authority Boundary

| Allowed | Forbidden |
|---|---|
| Construct typed snapshot objects from provided data | Query the database |
| Compute SHA-256 integrity hashes from canonical JSON | Access environment variables |
| Return frozen, immutable snapshot objects | Modify snapshots after construction |
| Validate input structure | Invoke the scoring engine |

## Files

- `assessment-snapshot.builder.ts` — Builds `AssessmentSnapshot` + `DeltaBlock`
- `dpi-snapshot.builder.ts` — Builds `DpiSnapshot` + computes DPI composite

## Data Flow

```
Orchestrator resolves all input data (from DB, validation, etc.)
  → passes resolved data to snapshot builder
  → builder constructs immutable snapshot with SHA-256 hash
  → orchestrator feeds snapshot to scoring engine
  → orchestrator persists snapshot to database
```

## Immutability Contract

Once a snapshot is built:

- Its `snapshotHash` is computed from canonical JSON of all fields.
- No field may be mutated after construction.
- All TypeScript types use `readonly` properties.
- Snapshots are persisted as append-only rows — never updated or deleted.

## Interaction Rules

- **Called by:** Orchestrators (`lib/orchestration/`)
- **Never called by:** React components, pages, hooks, stores
- **Imports from:** Engine types (`types.ts`), canonical JSON utility
- **Never imports:** `@prisma/client`, `@/lib/db/*`
