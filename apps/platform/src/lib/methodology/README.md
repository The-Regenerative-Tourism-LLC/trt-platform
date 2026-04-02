# Methodology — Scoring Configuration Bundles

This directory contains `MethodologyBundle` definitions that configure the
TRT Scoring Engine.

## Authority Boundary

| Allowed | Forbidden |
|---|---|
| Define scoring weights, thresholds, and normalisation bounds | Be imported in frontend code |
| Provide bundle loading utilities | Be modified without version increment |
| Version bundles for audit traceability | Delete old bundles |

## Files

- `default-bundle.ts` — The active `MethodologyBundle` (v1.0.0)
- `methodology-bundle.loader.ts` — Loads the active bundle (with hash computation)

## Governance Rules

- Every `ScoreSnapshot` references exactly one `methodologyVersion` + `bundleHash`.
- Changes to weights, thresholds, or bounds create a **new version** — old bundles
  are never modified or deleted.
- Historical scores are reproducible by replaying with the bundle version they
  were computed against.

## Interaction Rules

- **Imported by:** Scoring orchestrator, engine tests
- **Never imported by:** React components, pages, hooks, stores, client code
- **Consumed by:** The scoring engine as a pure input parameter
