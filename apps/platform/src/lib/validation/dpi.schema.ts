import { z } from "zod";

export const TerritorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().optional(),
});

export const ComputeDpiRequestSchema = z.object({
  territoryId: z.string().min(1),
});

export const DpiComponentsSchema = z.object({
  touristIntensity: z.number().min(0).max(100),
  ecologicalSensitivity: z.number().min(0).max(100),
  economicLeakageRate: z.number().min(0).max(100),
  regenerativePerf: z.number().min(0).max(100),
});

export type TerritoryInput = z.infer<typeof TerritorySchema>;
export type ComputeDpiRequest = z.infer<typeof ComputeDpiRequestSchema>;
