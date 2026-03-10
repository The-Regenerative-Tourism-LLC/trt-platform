/**
 * DPI Orchestrator
 *
 * Orchestrates the computation and persistence of a DPI snapshot for a territory.
 *
 * Responsibilities:
 *   1. Validate territory exists
 *   2. Fetch external DPI component data (World Bank, IUCN, etc.)
 *   3. Compute regenerative performance from live operator GPS scores
 *   4. Build the DpiSnapshot
 *   5. Persist to dpi_snapshots table (immutable record)
 *   6. Update territory read model (denormalised for fast display)
 *   7. Return result
 *
 * DPI computation itself happens in the snapshot builder — the engine is
 * only invoked for GPS computation. DPI composite is a direct weighted sum.
 */

import { buildDpiSnapshot, computeDpiComposite } from "../snapshots/dpi-snapshot.builder";
import { findTerritoryById, upsertTerritoryDpiReadModel } from "../db/repositories/dpi.repo";
import { createDpiSnapshot } from "../db/repositories/dpi.repo";
import { findPublishedScoresByTerritory } from "../db/repositories/score.repo";
import { logAuditEvent } from "../audit/logger";

// World Bank indicator codes
const WB_TOURISM_ARRIVALS = "ST.INT.ARVL";
const WB_POPULATION = "SP.POP.TOTL";
const WB_TOURISM_RECEIPTS = "ST.INT.RCPT.CD";
const WB_GDP = "NY.GDP.MKTP.CD";

async function fetchWorldBankIndicator(
  countryCode: string,
  indicator: string
): Promise<number | null> {
  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&date=2018:2023&per_page=10`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json[1]) return null;
    for (const entry of json[1] as any[]) {
      if (entry.value !== null) return entry.value;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchProtectedAreaPct(countryCode: string): Promise<number | null> {
  return fetchWorldBankIndicator(countryCode, "ER.LND.PTLD.ZS");
}

async function fetchForestPct(countryCode: string): Promise<number | null> {
  return fetchWorldBankIndicator(countryCode, "AG.LND.FRST.ZS");
}

function touristIntensityScore(arrivals: number | null, population: number | null): number {
  if (!arrivals || !population || population === 0) return 50;
  const ratio = (arrivals / population) * 100;
  if (ratio > 200) return 95;
  if (ratio > 100) return 85;
  if (ratio > 50) return 70;
  if (ratio > 20) return 55;
  if (ratio > 10) return 40;
  if (ratio > 5) return 25;
  return 15;
}

function ecologicalSensitivityScore(
  protectedPct: number | null,
  forestPct: number | null
): number {
  const prot = protectedPct ?? 15;
  const forest = forestPct ?? 30;
  return Math.min(100, Math.round((prot * 0.6 + forest * 0.4) * 2));
}

function economicLeakageScore(receipts: number | null, gdp: number | null): number {
  if (!receipts || !gdp || gdp === 0) return 40;
  const pct = (receipts / gdp) * 100;
  if (pct > 30) return 70;
  if (pct > 15) return 55;
  if (pct > 8) return 40;
  if (pct > 3) return 30;
  return 20;
}

const COUNTRY_ISO: Record<string, string> = {
  portugal: "PRT", spain: "ESP", france: "FRA", italy: "ITA",
  greece: "GRC", croatia: "HRV", germany: "DEU", netherlands: "NLD",
  austria: "AUT", switzerland: "CHE", sweden: "SWE", norway: "NOR",
  denmark: "DNK", finland: "FIN", ireland: "IRL", iceland: "ISL",
  "united kingdom": "GBR", morocco: "MAR", kenya: "KEN",
  "south africa": "ZAF", tanzania: "TZA", rwanda: "RWA",
  "costa rica": "CRI", mexico: "MEX", colombia: "COL", peru: "PER",
  brazil: "BRA", argentina: "ARG", chile: "CHL",
  thailand: "THA", indonesia: "IDN", vietnam: "VNM", india: "IND",
  "sri lanka": "LKA", japan: "JPN", australia: "AUS",
  "new zealand": "NZL", maldives: "MDV",
  madeira: "PRT", azores: "PRT", algarve: "PRT",
  "canary islands": "ESP", bali: "IDN",
};

function resolveCountryCode(country: string, regionName: string): string | null {
  const search = `${regionName} ${country}`.toLowerCase().trim();
  for (const [name, code] of Object.entries(COUNTRY_ISO)) {
    if (search.includes(name)) return code;
  }
  return COUNTRY_ISO[country.toLowerCase().trim()] || null;
}

export interface DpiResult {
  territoryId: string;
  touristIntensity: number;
  ecologicalSensitivity: number;
  economicLeakageRate: number;
  regenerativePerf: number;
  compositeDpi: number;
  pressureLevel: "low" | "moderate" | "high";
  operatorCohortSize: number;
  dpiSnapshotId: string;
}

export async function runDpiComputation(
  territoryId: string,
  actorUserId: string
): Promise<DpiResult> {
  const territory = await findTerritoryById(territoryId);
  if (!territory) throw new Error(`Territory not found: ${territoryId}`);

  const countryCode = resolveCountryCode(
    territory.country ?? "",
    territory.name ?? ""
  );

  let touristIntensity = 50;
  let ecologicalSensitivity = 50;
  let economicLeakageRate = 40;

  if (countryCode) {
    const [arrivals, population, protectedPct, forestPct, receipts, gdp] =
      await Promise.all([
        fetchWorldBankIndicator(countryCode, WB_TOURISM_ARRIVALS),
        fetchWorldBankIndicator(countryCode, WB_POPULATION),
        fetchProtectedAreaPct(countryCode),
        fetchForestPct(countryCode),
        fetchWorldBankIndicator(countryCode, WB_TOURISM_RECEIPTS),
        fetchWorldBankIndicator(countryCode, WB_GDP),
      ]);

    touristIntensity = touristIntensityScore(arrivals, population);
    ecologicalSensitivity = ecologicalSensitivityScore(protectedPct, forestPct);
    economicLeakageRate = economicLeakageScore(receipts, gdp);
  }

  // Regenerative performance from live operator GPS scores
  const publishedScores = await findPublishedScoresByTerritory(territoryId);
  const operatorCohortSize = publishedScores.length;
  const regenerativePerf =
    operatorCohortSize > 0
      ? Math.round(
          publishedScores.reduce((sum, s) => sum + s.gpsTotal, 0) /
            operatorCohortSize
        )
      : 0;

  const createdAt = new Date().toISOString();
  const dpiSnapshot = buildDpiSnapshot(
    {
      territoryId,
      touristIntensity,
      ecologicalSensitivity,
      economicLeakageRate,
      regenerativePerf,
      operatorCohortSize,
    },
    createdAt
  );

  // Persist immutable DPI snapshot
  const persistedDpi = await createDpiSnapshot({
    territory: { connect: { id: territoryId } },
    touristIntensity: dpiSnapshot.touristIntensity,
    ecologicalSensitivity: dpiSnapshot.ecologicalSensitivity,
    economicLeakageRate: dpiSnapshot.economicLeakageRate,
    regenerativePerf: dpiSnapshot.regenerativePerf,
    compositeDpi: dpiSnapshot.compositeDpi,
    pressureLevel: dpiSnapshot.pressureLevel as any,
    operatorCohortSize: dpiSnapshot.operatorCohortSize,
    snapshotHash: dpiSnapshot.snapshotHash,
  });

  // Update territory read model for fast queries
  await upsertTerritoryDpiReadModel(territoryId, {
    touristIntensity,
    ecologicalSensitivity,
    economicLeakageRate,
    regenerativePerformance: regenerativePerf,
    compositeDpi: dpiSnapshot.compositeDpi,
    pressureLevel: dpiSnapshot.pressureLevel,
    operatorCohortSize,
    dpiComputedAt: new Date(),
  });

  await logAuditEvent({
    actor: actorUserId,
    action: "dpi.computed",
    entityType: "DpiSnapshot",
    entityId: persistedDpi.id,
    payload: {
      territoryId,
      compositeDpi: dpiSnapshot.compositeDpi,
      pressureLevel: dpiSnapshot.pressureLevel,
    },
  });

  return {
    territoryId,
    touristIntensity,
    ecologicalSensitivity,
    economicLeakageRate,
    regenerativePerf,
    compositeDpi: dpiSnapshot.compositeDpi,
    pressureLevel: dpiSnapshot.pressureLevel,
    operatorCohortSize,
    dpiSnapshotId: persistedDpi.id,
  };
}
