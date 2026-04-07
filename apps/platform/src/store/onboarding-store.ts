"use client";

/**
 * Onboarding UI Store (Zustand)
 *
 * Internal state uses the new capability-based OnboardingState (sliced by
 * business capability and assessment section).
 *
 * Backward-compatible surface:
 *   - stepId          → alias for currentStepId (old string format)
 *   - data            → flat view of all slices via compat.ts
 *   - updateField()   → routes flat patches via field-router.ts
 *   - loadDraft()     → migrates v1/v2 drafts via draft-migration.ts
 *   - saveDraft()     → saves sliced dataJson (API contract unchanged)
 *
 * New surface (for use with the new engine):
 *   - capabilities, base, accommodation, tours, activity, pillar1–3, evidence
 *   - currentStepId
 *   - getOnboardingState()
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingData } from "@/lib/onboarding/onboarding-steps";
import {
  ONBOARDING_STEPS,
  getNextStep,
  getPreviousStep,
  validateStep as validateStepLegacy,
  getStepIndex,
} from "@/lib/onboarding/onboarding-steps";
import type { OnboardingState } from "@/lib/onboarding/types";
import { migrateDraft, makeInitialState, mapLegacyStepId } from "@/lib/onboarding/engine/draft-migration";
import { computeFlatData, flattenState } from "@/lib/onboarding/engine/compat";
import { routePatch } from "@/lib/onboarding/engine/field-router";

export type { OnboardingData };

// ── Store interface ───────────────────────────────────────────────────────────

interface OnboardingStore extends OnboardingState {
  // ── Backward-compat surface ───────────────────────────────────────────────
  stepId: string;
  data: OnboardingData;

  updateField: (patch: Partial<OnboardingData>) => void;
  nextStep: () => boolean;
  previousStep: () => void;
  setStepId: (id: string) => void;
  loadDraft: (draft: { currentStep: number; dataJson: Record<string, unknown> }) => void;
  saveDraft: () => Promise<void>;
  resetOnboarding: () => void;

  // ── New engine surface ────────────────────────────────────────────────────
  getOnboardingState: () => OnboardingState;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_STEP_ID = ONBOARDING_STEPS[0].id;

// ── Store ─────────────────────────────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => {
      const initial = makeInitialState();

      return {
        ...initial,
        stepId: INITIAL_STEP_ID,
        data: computeFlatData(initial),

        updateField: (patch) => {
          set((state) => {
            const routed = routePatch(patch, state);
            const next: OnboardingState = {
              ...state,
              ...routed,
              capabilities: routed.capabilities ?? state.capabilities,
            };
            return { ...routed, capabilities: next.capabilities, data: computeFlatData(next) };
          });
        },

        nextStep: () => {
          const { stepId, data } = get();
          if (!validateStepLegacy(stepId, data)) return false;
          const next = getNextStep(stepId, data);
          if (!next) return false;
          set({ stepId: next.id, currentStepId: mapLegacyStepId(next.id) });
          return true;
        },

        previousStep: () => {
          const { stepId, data } = get();
          const prev = getPreviousStep(stepId, data);
          if (prev) set({ stepId: prev.id, currentStepId: mapLegacyStepId(prev.id) });
        },

        setStepId: (id) => {
          set({ stepId: id, currentStepId: mapLegacyStepId(id) });
        },

        loadDraft: (draft) => {
          const state = migrateDraft(draft.dataJson, draft.currentStep);
          const legacyStep = ONBOARDING_STEPS[draft.currentStep];
          set({
            ...state,
            stepId: legacyStep?.id ?? INITIAL_STEP_ID,
            data: computeFlatData(state),
          });
        },

        saveDraft: async () => {
          const s = get();
          const idx = getStepIndex(s.stepId);
          const res = await fetch("/api/v1/onboarding/draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentStep: idx === -1 ? 0 : idx,
              dataJson: {
                _v: 2,
                capabilities: s.capabilities,
                base: s.base,
                accommodation: s.accommodation,
                tours: s.tours,
                activity: s.activity,
                pillar1: s.pillar1,
                pillar2: s.pillar2,
                pillar3: s.pillar3,
                evidence: s.evidence,
                ...flattenState(s),
              },
            }),
          });
          if (!res.ok) throw new Error("Draft save failed");
        },

        resetOnboarding: () => {
          const s = makeInitialState();
          set({ ...s, stepId: INITIAL_STEP_ID, data: computeFlatData(s) });
        },

        getOnboardingState: () => {
          const s = get();
          return {
            _v: 2,
            capabilities: s.capabilities,
            currentStepId: s.currentStepId,
            base: s.base,
            accommodation: s.accommodation,
            tours: s.tours,
            activity: s.activity,
            pillar1: s.pillar1,
            pillar2: s.pillar2,
            pillar3: s.pillar3,
            evidence: s.evidence,
          };
        },
      };
    },
    {
      name: "trt-onboarding",
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          const old = (persistedState ?? {}) as { stepId?: string; data?: Record<string, unknown> };
          const state = migrateDraft(old.data ?? {}, old.stepId);
          return {
            ...state,
            stepId: old.stepId ?? INITIAL_STEP_ID,
            data: computeFlatData(state),
          } as OnboardingStore;
        }
        return persistedState as OnboardingStore;
      },
      partialize: (s) => ({
        _v: s._v,
        capabilities: s.capabilities,
        currentStepId: s.currentStepId,
        stepId: s.stepId,
        data: s.data,
        base: s.base,
        accommodation: s.accommodation,
        tours: s.tours,
        activity: s.activity,
        pillar1: s.pillar1,
        pillar2: s.pillar2,
        pillar3: s.pillar3,
        evidence: s.evidence,
      }),
    }
  )
);
