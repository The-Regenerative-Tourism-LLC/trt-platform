# Golden Test Vectors

This directory contains JSON fixtures representing known-good input/output
pairs for the TRT Scoring Engine.

## Purpose

Golden vectors protect scoring integrity across refactors, dependency updates,
and methodology changes. CI must fail if any golden output changes unexpectedly.

## Structure

Each golden vector is a JSON file containing:

```json
{
  "vectorId": "GV-001",
  "description": "Baseline cycle — Type A operator, no DPS",
  "input": {
    "assessmentSnapshot": { ... },
    "dpiSnapshot": { ... },
    "methodologyBundle": { ... }
  },
  "expectedOutput": {
    "gpsTotal": 73,
    "gpsBand": "regenerative_practice",
    "p1Score": 76.65,
    "p2Score": 70.55,
    "p3Score": 70,
    "dpsTotal": null,
    "dpsBand": null,
    "dpiScore": 56,
    "dpiPressureLevel": "moderate"
  }
}
```

## Usage

- **In-repo tests:** `engine/trt-scoring-engine/__tests__/golden-vectors.test.ts`
  uses inline vector definitions derived from these fixtures.
- **External validation:** These JSON files can be consumed by external tools,
  cross-language implementations, or audit processes.
- **Methodology upgrade:** When a new `MethodologyBundle` version is released,
  new vectors must be created and old vectors archived (not deleted).

## Adding a New Vector

1. Define input data (all three inputs must be complete).
2. Run the engine locally to compute the expected output.
3. Verify the output is correct.
4. Create a new JSON file following the naming convention `gv-NNN-description.json`.
5. Add a corresponding test case in `golden-vectors.test.ts`.

## Rules

- Golden vectors must **never** be modified to match changed engine output.
- If the engine output changes, the change must be intentional and documented.
- Each vector must reproduce the same output indefinitely given the same inputs.
- Vectors cover: baseline cycle, Cycle 2+ with DPS, Type A/B/C operators,
  Status D (forward commitment), perfect/zero scores, edge cases.
