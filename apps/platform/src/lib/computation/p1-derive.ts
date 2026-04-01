/**
 * Pillar 1 Derivation Module
 *
 * Pure computation — no side effects, no DB access, no imports from outside this module.
 * This is the ONLY location where raw P1 inputs are converted to derived indicator values.
 * TDD §7: derivation must happen server-side, never in frontend components or hooks.
 *
 * Grid emission factor: 0.149 kg CO₂e/kWh (Portugal 2024, Scope 2)
 */

const GRID_EMISSION_FACTOR_KG_CO2E_PER_KWH = 0.149;

// Fuel emission factors (kg CO₂e per litre)
const FUEL_EMISSION_FACTORS: Record<"diesel" | "petrol", number> = {
  diesel: 2.68,
  petrol: 2.31,
};

export interface RawP1Inputs {
  operatorType: "A" | "B" | "C";
  guestNights?: number;
  visitorDays?: number;
  /** Only relevant for Type C — proportion of revenue from accommodation (0–100) */
  revenueSplitAccommodationPct?: number;
  /** Only relevant for Type C — proportion of revenue from experiences (0–100) */
  revenueSplitExperiencePct?: number;
  totalElectricityKwh?: number;
  totalGasKwh?: number;
  /** Surplus kWh exported to grid (annual) — reduces net grid draw */
  gridExportKwh?: number;
  /** Additional metered electricity (e.g. office), added to main total */
  officeElectricityKwh?: number;
  tourFuelType?: string;
  tourFuelLitresPerMonth?: number;
  evKwhPerMonth?: number;
  totalWaterLitres?: number;
  totalWasteKg?: number;
  wasteRecycledKg?: number;
  wasteCompostedKg?: number;
  wasteOtherDivertedKg?: number;
  renewableOnsitePct?: number;
  renewableTariffPct?: number;
  scope3TransportKgCo2e?: number;
  siteScore?: number;
}

export interface DerivedP1Indicators {
  /** kWh per Activity Unit */
  energyIntensity: number;
  /** % renewable energy (onsite + tariff, capped at 100) */
  renewablePct: number;
  /** Litres per Activity Unit */
  waterIntensity: number;
  /** % waste diverted from landfill (recycled + composted + other) */
  wasteDiversionPct: number;
  /** kg CO₂e per Activity Unit (Scope 2 energy + Scope 3 transport) */
  carbonIntensity: number;
  /** Site/habitat score (pass-through, 0–100) */
  siteScore: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function safeDiv(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Derives the Activity Unit (AoU) denominator from raw inputs.
 *
 * - Type A (accommodation): guest-nights
 * - Type B (experience only): visitor-days
 * - Type C (mixed): NOT used directly — Type C uses two separate AoUs
 *   (guest_nights for accommodation side, visitor_days for experience side).
 *   Falls back to guest-nights if neither is present.
 */
function deriveActivityUnit(raw: RawP1Inputs): number {
  const gn = raw.guestNights ?? 0;
  const vd = raw.visitorDays ?? 0;

  if (raw.operatorType === "A") return gn;
  if (raw.operatorType === "B") return vd;

  // Type C fallback — should not be called in normal flow (use computeTypeCDualP1Intensities)
  return gn > 0 ? gn : vd;
}

/**
 * Core intensity computation given an explicit Activity Unit denominator.
 * Used internally by computeP1Intensities and computeTypeCDualP1Intensities.
 */
function computeIntensitiesWithAoU(raw: RawP1Inputs, aou: number): DerivedP1Indicators {
  // ── Energy ──────────────────────────────────────────────────────────────
  const netElectricityKwh = Math.max(
    0,
    (raw.totalElectricityKwh ?? 0) +
      (raw.officeElectricityKwh ?? 0) -
      (raw.gridExportKwh ?? 0)
  );
  const totalEnergyKwh = netElectricityKwh + (raw.totalGasKwh ?? 0);
  const energyIntensity = round2(safeDiv(totalEnergyKwh, aou));

  // ── Renewable % ─────────────────────────────────────────────────────────
  const renewableRaw = (raw.renewableOnsitePct ?? 0) + (raw.renewableTariffPct ?? 0);
  const renewablePct = round2(Math.min(renewableRaw, 100));

  // ── Water ────────────────────────────────────────────────────────────────
  const waterIntensity = round2(safeDiv(raw.totalWaterLitres ?? 0, aou));

  // ── Waste diversion ──────────────────────────────────────────────────────
  const wasteDiverted =
    (raw.wasteRecycledKg ?? 0) +
    (raw.wasteCompostedKg ?? 0) +
    (raw.wasteOtherDivertedKg ?? 0);
  const wasteDiversionPct = round2(safeDiv(wasteDiverted, raw.totalWasteKg ?? 0) * 100);

  // ── Carbon intensity ─────────────────────────────────────────────────────
  const scope2ElectricityKgCo2e =
    netElectricityKwh * GRID_EMISSION_FACTOR_KG_CO2E_PER_KWH;

  let fuelKgCo2e = 0;
  if (
    raw.tourFuelType &&
    raw.tourFuelType !== "electric" &&
    raw.tourFuelType !== "no_vehicle" &&
    raw.tourFuelLitresPerMonth
  ) {
    const ft = raw.tourFuelType as keyof typeof FUEL_EMISSION_FACTORS;
    const factor = FUEL_EMISSION_FACTORS[ft];
    if (factor != null) {
      fuelKgCo2e = raw.tourFuelLitresPerMonth * 12 * factor;
    }
  }

  const evScope2KgCo2e =
    ((raw.evKwhPerMonth ?? 0) * 12) * GRID_EMISSION_FACTOR_KG_CO2E_PER_KWH;

  const scope3KgCo2e = raw.scope3TransportKgCo2e ?? 0;

  const totalCarbonKgCo2e = scope2ElectricityKgCo2e + fuelKgCo2e + evScope2KgCo2e + scope3KgCo2e;
  const carbonIntensity = round2(safeDiv(totalCarbonKgCo2e, aou));

  // ── Site score ────────────────────────────────────────────────────────────
  const siteScore = round2(raw.siteScore ?? 0);

  return {
    energyIntensity,
    renewablePct,
    waterIntensity,
    wasteDiversionPct,
    carbonIntensity,
    siteScore,
  };
}

/**
 * Converts raw Pillar 1 inputs into derived indicator values ready for engine consumption.
 * All results are rounded to 2 decimal places.
 * Divide-by-zero returns 0.
 *
 * For Type C operators, use computeTypeCDualP1Intensities instead.
 */
export function computeP1Intensities(raw: RawP1Inputs): DerivedP1Indicators {
  const aou = deriveActivityUnit(raw);
  return computeIntensitiesWithAoU(raw, aou);
}

export interface DualP1Indicators {
  /** Accommodation-side indicators derived using guest_nights as AoU */
  readonly acc: DerivedP1Indicators;
  /** Experience-side indicators derived using visitor_days as AoU */
  readonly exp: DerivedP1Indicators;
}

/**
 * Type C only: derives two separate P1 indicator sets using distinct Activity Units.
 * - acc: guest_nights as denominator (accommodation operational footprint)
 * - exp: visitor_days as denominator (experience operational footprint)
 * These are combined by revenue split in the scoring engine (compute-score.ts).
 */
export function computeTypeCDualP1Intensities(raw: RawP1Inputs): DualP1Indicators {
  const gn = raw.guestNights ?? 0;
  const vd = raw.visitorDays ?? 0;
  return {
    acc: computeIntensitiesWithAoU(raw, gn),
    exp: computeIntensitiesWithAoU(raw, vd),
  };
}
