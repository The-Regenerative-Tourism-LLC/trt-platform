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
  tourFuelType?: "diesel" | "petrol" | "electric";
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
 * - Type C (mixed): weighted average of guest-nights and visitor-days
 *   by revenue split. Falls back to guest-nights if split is unavailable.
 */
function deriveActivityUnit(raw: RawP1Inputs): number {
  const gn = raw.guestNights ?? 0;
  const vd = raw.visitorDays ?? 0;

  if (raw.operatorType === "A") return gn;
  if (raw.operatorType === "B") return vd;

  // Type C — weighted by revenue split
  const accPct = raw.revenueSplitAccommodationPct ?? null;
  const expPct = raw.revenueSplitExperiencePct ?? null;

  if (accPct !== null && expPct !== null) {
    const total = accPct + expPct;
    if (total > 0) {
      return (gn * accPct + vd * expPct) / total;
    }
  }

  // Fallback: use guest-nights if revenue split not provided
  return gn > 0 ? gn : vd;
}

/**
 * Converts raw Pillar 1 inputs into derived indicator values ready for engine consumption.
 * All results are rounded to 2 decimal places.
 * Divide-by-zero returns 0.
 */
export function computeP1Intensities(raw: RawP1Inputs): DerivedP1Indicators {
  const aou = deriveActivityUnit(raw);

  // ── Energy ──────────────────────────────────────────────────────────────
  const totalEnergyKwh = (raw.totalElectricityKwh ?? 0) + (raw.totalGasKwh ?? 0);
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
  // Scope 2: electricity × grid factor
  const scope2ElectricityKgCo2e =
    (raw.totalElectricityKwh ?? 0) * GRID_EMISSION_FACTOR_KG_CO2E_PER_KWH;

  // Scope 2: transport fuel (liquid fuels only)
  let fuelKgCo2e = 0;
  if (raw.tourFuelType && raw.tourFuelType !== "electric" && raw.tourFuelLitresPerMonth) {
    const factor = FUEL_EMISSION_FACTORS[raw.tourFuelType];
    // tourFuelLitresPerMonth × 12 months
    fuelKgCo2e = raw.tourFuelLitresPerMonth * 12 * factor;
  }

  // Scope 2: EV charging (included in electricity grid factor)
  const evScope2KgCo2e =
    ((raw.evKwhPerMonth ?? 0) * 12) * GRID_EMISSION_FACTOR_KG_CO2E_PER_KWH;

  // Scope 3: operator-reported transport
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
