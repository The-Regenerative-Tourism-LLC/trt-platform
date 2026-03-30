"use client";

/**
 * Onboarding UI Store (Zustand)
 *
 * Raw onboarding data only — no derived or computed values.
 * All scoring comes from POST /api/v1/score/preview.
 * Step navigation delegates to onboarding-steps.ts helpers.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingData } from "@/lib/onboarding/onboarding-steps";
import {
  ONBOARDING_STEPS,
  getNextStep,
  getPreviousStep,
  validateStep,
  getStepIndex,
} from "@/lib/onboarding/onboarding-steps";

export type { OnboardingData };

interface OnboardingStore {
  stepId: string;
  data: OnboardingData;

  updateField: (patch: Partial<OnboardingData>) => void;
  nextStep: () => boolean;
  previousStep: () => void;
  setStepId: (id: string) => void;
  loadDraft: (draft: { currentStep: number; dataJson: Record<string, unknown> }) => void;
  saveDraft: () => Promise<void>;
  resetOnboarding: () => void;
}

const INITIAL_STEP = ONBOARDING_STEPS[0].id;

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      stepId: INITIAL_STEP,
      data: {},

      updateField: (patch) =>
        set((state) => ({ data: { ...state.data, ...patch } })),

      nextStep: () => {
        const { stepId, data } = get();
        if (!validateStep(stepId, data)) return false;
        const next = getNextStep(stepId, data);
        if (!next) return false;
        set({ stepId: next.id });
        return true;
      },

      previousStep: () => {
        const { stepId, data } = get();
        const prev = getPreviousStep(stepId, data);
        if (prev) set({ stepId: prev.id });
      },

      setStepId: (id) => set({ stepId: id }),

      loadDraft: (draft) => {
        const step = ONBOARDING_STEPS[draft.currentStep];
        set({
          stepId: step?.id ?? INITIAL_STEP,
          data: (draft.dataJson ?? {}) as OnboardingData,
        });
      },

      saveDraft: async () => {
        const { stepId, data } = get();
        const idx = getStepIndex(stepId);
        const res = await fetch("/api/v1/onboarding/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentStep: idx === -1 ? 0 : idx,
            dataJson: data,
          }),
        });
        if (!res.ok) throw new Error("Draft save failed");
      },

      resetOnboarding: () => set({ stepId: INITIAL_STEP, data: {} }),
    }),
    {
      name: "trt-onboarding",
      partialize: (state) => ({ stepId: state.stepId, data: state.data }),
    }
  )
);
