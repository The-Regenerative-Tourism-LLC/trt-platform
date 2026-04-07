import { describe, it, expect } from 'vitest';
import { STEP_REGISTRY } from '@/lib/onboarding/registry/step-registry';
import { CAPABILITY_REGISTRY, CAPABILITY_ORDER } from '@/lib/onboarding/registry/capability-registry';
import { SECTION_REGISTRY, SECTION_ORDER } from '@/lib/onboarding/registry/section-registry';
import { makeInitialState } from '@/lib/onboarding/engine/draft-migration';

// ── Step Registry ─────────────────────────────────────────────────────────────

describe('STEP_REGISTRY — structure', () => {
  const ALL_EXPECTED_IDS = [
    'base:capability-select', 'base:identity', 'base:revenue-split', 'base:photos',
    'accommodation:setup',
    'tours:setup',
    'pillar1:energy', 'pillar1:water', 'pillar1:waste', 'pillar1:carbon', 'pillar1:site',
    'pillar2:employment', 'pillar2:procurement', 'pillar2:revenue', 'pillar2:community',
    'pillar3:status', 'pillar3:programme', 'pillar3:forward-commitment',
    'evidence:delta', 'evidence:checklist',
    'review:gps-preview', 'review:submit',
  ];

  it('contains exactly the expected step IDs — no additions or omissions', () => {
    const actualIds = Object.keys(STEP_REGISTRY).sort();
    expect(actualIds).toEqual([...ALL_EXPECTED_IDS].sort());
  });

  it('every step id field matches its registry key', () => {
    for (const [key, step] of Object.entries(STEP_REGISTRY)) {
      expect(step.id, `key "${key}" has mismatched id "${step.id}"`).toBe(key);
    }
  });

  it('all step IDs are unique', () => {
    const ids = Object.keys(STEP_REGISTRY);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each step has exactly one of capability or section — never both, never neither', () => {
    for (const step of Object.values(STEP_REGISTRY)) {
      const hasCap = step.capability !== undefined;
      const hasSec = step.section !== undefined;
      expect(hasCap || hasSec, `"${step.id}" has neither capability nor section`).toBe(true);
      expect(hasCap && hasSec, `"${step.id}" has both capability and section`).toBe(false);
    }
  });

  it('each step has a non-empty label and sectionLabel', () => {
    for (const step of Object.values(STEP_REGISTRY)) {
      expect(step.label.length, `"${step.id}" has empty label`).toBeGreaterThan(0);
      expect(step.sectionLabel.length, `"${step.id}" has empty sectionLabel`).toBeGreaterThan(0);
    }
  });
});

describe('STEP_REGISTRY — capability assignments', () => {
  it('base steps have capability: "base"', () => {
    for (const id of ['base:capability-select', 'base:identity', 'base:revenue-split', 'base:photos']) {
      expect(STEP_REGISTRY[id].capability).toBe('base');
      expect(STEP_REGISTRY[id].section).toBeUndefined();
    }
  });

  it('accommodation:setup has capability: "accommodation"', () => {
    expect(STEP_REGISTRY['accommodation:setup'].capability).toBe('accommodation');
    expect(STEP_REGISTRY['accommodation:setup'].section).toBeUndefined();
  });

  it('tours:setup has capability: "tours"', () => {
    expect(STEP_REGISTRY['tours:setup'].capability).toBe('tours');
    expect(STEP_REGISTRY['tours:setup'].section).toBeUndefined();
  });
});

describe('STEP_REGISTRY — section assignments', () => {
  it('pillar1 steps have section: "pillar1" and no capability', () => {
    for (const id of ['pillar1:energy', 'pillar1:water', 'pillar1:waste', 'pillar1:carbon', 'pillar1:site']) {
      expect(STEP_REGISTRY[id].section).toBe('pillar1');
      expect(STEP_REGISTRY[id].capability).toBeUndefined();
    }
  });

  it('pillar2 steps have section: "pillar2" and no capability', () => {
    for (const id of ['pillar2:employment', 'pillar2:procurement', 'pillar2:revenue', 'pillar2:community']) {
      expect(STEP_REGISTRY[id].section).toBe('pillar2');
      expect(STEP_REGISTRY[id].capability).toBeUndefined();
    }
  });

  it('pillar3 steps have section: "pillar3" and no capability', () => {
    for (const id of ['pillar3:status', 'pillar3:programme', 'pillar3:forward-commitment']) {
      expect(STEP_REGISTRY[id].section).toBe('pillar3');
      expect(STEP_REGISTRY[id].capability).toBeUndefined();
    }
  });

  it('evidence steps have section: "evidence" and no capability', () => {
    for (const id of ['evidence:delta', 'evidence:checklist']) {
      expect(STEP_REGISTRY[id].section).toBe('evidence');
      expect(STEP_REGISTRY[id].capability).toBeUndefined();
    }
  });

  it('review steps have section: "review" and no capability', () => {
    for (const id of ['review:gps-preview', 'review:submit']) {
      expect(STEP_REGISTRY[id].section).toBe('review');
      expect(STEP_REGISTRY[id].capability).toBeUndefined();
    }
  });
});

describe('STEP_REGISTRY — conditional steps have condition functions', () => {
  it('base:revenue-split has a condition', () => {
    expect(STEP_REGISTRY['base:revenue-split'].condition).toBeTypeOf('function');
  });

  it('accommodation:setup has a condition', () => {
    expect(STEP_REGISTRY['accommodation:setup'].condition).toBeTypeOf('function');
  });

  it('tours:setup has a condition', () => {
    expect(STEP_REGISTRY['tours:setup'].condition).toBeTypeOf('function');
  });

  it('pillar1:water has a condition', () => {
    expect(STEP_REGISTRY['pillar1:water'].condition).toBeTypeOf('function');
  });

  it('pillar3:programme has a condition', () => {
    expect(STEP_REGISTRY['pillar3:programme'].condition).toBeTypeOf('function');
  });

  it('pillar3:forward-commitment has a condition', () => {
    expect(STEP_REGISTRY['pillar3:forward-commitment'].condition).toBeTypeOf('function');
  });

  it('evidence:delta has a condition', () => {
    expect(STEP_REGISTRY['evidence:delta'].condition).toBeTypeOf('function');
  });
});

// ── Capability Registry ───────────────────────────────────────────────────────

describe('CAPABILITY_REGISTRY', () => {
  const s = makeInitialState();

  it('has exactly three capabilities', () => {
    expect(Object.keys(CAPABILITY_REGISTRY)).toHaveLength(3);
    expect(Object.keys(CAPABILITY_REGISTRY)).toContain('base');
    expect(Object.keys(CAPABILITY_REGISTRY)).toContain('accommodation');
    expect(Object.keys(CAPABILITY_REGISTRY)).toContain('tours');
  });

  it('all steps referenced by capabilities exist in STEP_REGISTRY', () => {
    for (const cap of Object.values(CAPABILITY_REGISTRY)) {
      for (const stepId of cap.steps) {
        expect(STEP_REGISTRY[stepId], `"${stepId}" in capability "${cap.id}" not in STEP_REGISTRY`).toBeDefined();
      }
    }
  });

  it('base is always active regardless of selection', () => {
    expect(CAPABILITY_REGISTRY.base.condition([], s)).toBe(true);
    expect(CAPABILITY_REGISTRY.base.condition(['accommodation'], s)).toBe(true);
    expect(CAPABILITY_REGISTRY.base.condition(['tours'], s)).toBe(true);
    expect(CAPABILITY_REGISTRY.base.condition(['accommodation', 'tours'], s)).toBe(true);
  });

  it('accommodation is active only when selected', () => {
    expect(CAPABILITY_REGISTRY.accommodation.condition(['accommodation'], s)).toBe(true);
    expect(CAPABILITY_REGISTRY.accommodation.condition(['accommodation', 'tours'], s)).toBe(true);
    expect(CAPABILITY_REGISTRY.accommodation.condition(['tours'], s)).toBe(false);
    expect(CAPABILITY_REGISTRY.accommodation.condition([], s)).toBe(false);
  });

  it('tours is active only when selected', () => {
    expect(CAPABILITY_REGISTRY.tours.condition(['tours'], s)).toBe(true);
    expect(CAPABILITY_REGISTRY.tours.condition(['accommodation', 'tours'], s)).toBe(true);
    expect(CAPABILITY_REGISTRY.tours.condition(['accommodation'], s)).toBe(false);
    expect(CAPABILITY_REGISTRY.tours.condition([], s)).toBe(false);
  });

  it('base.steps contains all 4 base profile steps in order', () => {
    expect(CAPABILITY_REGISTRY.base.steps).toEqual([
      'base:capability-select', 'base:identity', 'base:revenue-split', 'base:photos',
    ]);
  });

  it('accommodation.steps contains accommodation:setup', () => {
    expect(CAPABILITY_REGISTRY.accommodation.steps).toContain('accommodation:setup');
  });

  it('tours.steps contains tours:setup', () => {
    expect(CAPABILITY_REGISTRY.tours.steps).toContain('tours:setup');
  });

  it('CAPABILITY_ORDER is [base, accommodation, tours]', () => {
    expect([...CAPABILITY_ORDER]).toEqual(['base', 'accommodation', 'tours']);
  });
});

// ── Section Registry ──────────────────────────────────────────────────────────

describe('SECTION_REGISTRY', () => {
  it('has exactly 5 sections', () => {
    expect(Object.keys(SECTION_REGISTRY)).toHaveLength(5);
  });

  it('all steps referenced by sections exist in STEP_REGISTRY', () => {
    for (const section of Object.values(SECTION_REGISTRY)) {
      for (const stepId of section.steps) {
        expect(STEP_REGISTRY[stepId], `"${stepId}" in section "${section.id}" not in STEP_REGISTRY`).toBeDefined();
      }
    }
  });

  it('pillar1 has exactly 5 steps in order', () => {
    expect([...SECTION_REGISTRY.pillar1.steps]).toEqual([
      'pillar1:energy', 'pillar1:water', 'pillar1:waste', 'pillar1:carbon', 'pillar1:site',
    ]);
  });

  it('pillar2 has exactly 4 steps in order', () => {
    expect([...SECTION_REGISTRY.pillar2.steps]).toEqual([
      'pillar2:employment', 'pillar2:procurement', 'pillar2:revenue', 'pillar2:community',
    ]);
  });

  it('pillar3 has exactly 3 steps in order', () => {
    expect([...SECTION_REGISTRY.pillar3.steps]).toEqual([
      'pillar3:status', 'pillar3:programme', 'pillar3:forward-commitment',
    ]);
  });

  it('evidence has exactly 2 steps in order', () => {
    expect([...SECTION_REGISTRY.evidence.steps]).toEqual(['evidence:delta', 'evidence:checklist']);
  });

  it('review has exactly 2 steps in order', () => {
    expect([...SECTION_REGISTRY.review.steps]).toEqual(['review:gps-preview', 'review:submit']);
  });

  it('SECTION_ORDER is [pillar1, pillar2, pillar3, evidence, review]', () => {
    expect([...SECTION_ORDER]).toEqual(['pillar1', 'pillar2', 'pillar3', 'evidence', 'review']);
  });

  it('each section has non-empty label and shortLabel', () => {
    for (const section of Object.values(SECTION_REGISTRY)) {
      expect(section.label.length).toBeGreaterThan(0);
      expect(section.shortLabel.length).toBeGreaterThan(0);
    }
  });
});
