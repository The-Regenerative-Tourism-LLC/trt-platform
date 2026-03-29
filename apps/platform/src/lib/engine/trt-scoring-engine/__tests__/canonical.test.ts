/**
 * Canonical JSON — Determinism & Recursive Sorting Tests
 */

import { describe, it, expect } from "vitest";
import { canonicalize } from "../canonical";

describe("canonicalize", () => {
  it("sorts object keys lexicographically", () => {
    const result = canonicalize({ z: 1, a: 2, m: 3 });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it("recursively sorts nested objects", () => {
    const result = canonicalize({ b: { z: 1, a: 2 }, a: 1 });
    expect(result).toBe('{"a":1,"b":{"a":2,"z":1}}');
  });

  it("preserves array order while sorting objects inside arrays", () => {
    const result = canonicalize([{ b: 2, a: 1 }, { d: 4, c: 3 }]);
    expect(result).toBe('[{"a":1,"b":2},{"c":3,"d":4}]');
  });

  it("handles null and primitives", () => {
    expect(canonicalize(null)).toBe("null");
    expect(canonicalize(42)).toBe("42");
    expect(canonicalize("hello")).toBe('"hello"');
    expect(canonicalize(true)).toBe("true");
  });

  it("omits undefined values (same as JSON.stringify)", () => {
    const result = canonicalize({ a: 1, b: undefined, c: 3 });
    expect(result).toBe('{"a":1,"c":3}');
  });

  it("is deterministic — same input always produces same output", () => {
    const obj = {
      z: { y: [3, 2, 1], x: "hello" },
      a: { c: true, b: null },
    };
    const result1 = canonicalize(obj);
    const result2 = canonicalize(obj);
    const result3 = canonicalize(JSON.parse(JSON.stringify(obj)));
    expect(result1).toBe(result2);
    expect(result1).toBe(result3);
  });

  it("produces stable hashes for assessment-like structures", () => {
    const snapshot = {
      operatorId: "op-001",
      pillar1: { energyIntensity: 20, renewablePct: 75 },
      pillar2: { localEmploymentRate: 60 },
      assessmentCycle: 1,
    };
    const reversed = {
      assessmentCycle: 1,
      pillar2: { localEmploymentRate: 60 },
      pillar1: { renewablePct: 75, energyIntensity: 20 },
      operatorId: "op-001",
    };
    expect(canonicalize(snapshot)).toBe(canonicalize(reversed));
  });

  it("handles deeply nested structures (3+ levels)", () => {
    const deep = {
      level1: {
        level2: {
          level3: { z: 1, a: 2 },
          a: "first",
        },
        b: "second",
      },
    };
    const parsed = JSON.parse(canonicalize(deep));
    expect(Object.keys(parsed.level1)).toEqual(["b", "level2"]);
    expect(Object.keys(parsed.level1.level2)).toEqual(["a", "level3"]);
    expect(Object.keys(parsed.level1.level2.level3)).toEqual(["a", "z"]);
  });
});
