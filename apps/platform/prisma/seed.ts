/**
 * Prisma Seed Script
 *
 * Creates the minimum data needed to run the app locally and in staging.
 * Safe to run multiple times — all operations are idempotent (upsert/findFirst guards).
 *
 * What is seeded:
 *   1. Madeira, Portugal — the first live destination (isAvailable: true)
 *      with curated baseline DPI component values and an initial DpiSnapshot.
 *   2. Azores, Portugal — coming soon destination (isAvailable: false).
 *   3. Alentejo, Portugal — coming soon destination (isAvailable: false).
 *   4. Dev/test user accounts (admin, operator, traveler).
 *   5. Methodology bundle v1.0.0.
 *
 * Seed accounts:
 *   admin@trt-local.dev    / Admin1234!
 *   operator@trt-local.dev / Operator1234!
 *   traveler@trt-local.dev / Traveler1234!
 *
 * Run with: npm run db:seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { DEFAULT_METHODOLOGY_BUNDLE } from "../src/lib/methodology/default-bundle";

const prisma = new PrismaClient();

function hashBundle(bundle: typeof DEFAULT_METHODOLOGY_BUNDLE): string {
  const canonical = JSON.stringify(bundle, Object.keys(bundle).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

function computeDpiComposite(components: {
  touristIntensity: number;
  ecologicalSensitivity: number;
  economicLeakageRate: number;
  regenerativePerf: number;
}): { composite: number; pressureLevel: "low" | "moderate" | "high" } {
  const composite = Math.round(
    components.touristIntensity * 0.35 +
    components.ecologicalSensitivity * 0.30 +
    components.economicLeakageRate * 0.20 +
    (100 - components.regenerativePerf) * 0.15
  );
  const pressureLevel: "low" | "moderate" | "high" =
    composite >= 66 ? "high" : composite >= 33 ? "moderate" : "low";
  return { composite, pressureLevel };
}

function log(label: string, value: string) {
  console.log(`  ${label.padEnd(32)} ${value}`);
}

// ── Territory definitions ──────────────────────────────────────────────────────
//
// Madeira DPI baseline values (curated regional data, not World Bank national averages):
//   Tourist Intensity 75  — ~1.5M arrivals / 250k residents = 6× resident ratio
//   Ecological Sensitivity 80 — 70% protected area (laurisilva UNESCO), Natura 2000, island
//   Economic Leakage 60  — island import dependency, mix of independent / chain hotels
//   Regenerative Performance 0  — no assessed operators at seed time
//
//   DPI = 75×0.35 + 80×0.30 + 60×0.20 + (100-0)×0.15 = 26.25 + 24.0 + 12.0 + 15.0 = 77 → HIGH

const TERRITORIES = [
  {
    name: "Madeira",
    country: "Portugal",
    countryCode: "PRT",
    slug: "madeira",
    isAvailable: true,
    displayOrder: 1,
    description:
      "A sub-tropical Atlantic island with UNESCO-protected laurisilva forest, " +
      "dramatic levada trail networks, and a regenerative tourism community " +
      "actively building verified impact infrastructure.",
    dpi: {
      touristIntensity: 75,
      ecologicalSensitivity: 80,
      economicLeakageRate: 60,
      regenerativePerf: 0,
      operatorCohortSize: 0,
    },
  },
  {
    name: "Azores",
    country: "Portugal",
    countryCode: "PRT",
    slug: "azores",
    isAvailable: false,
    displayOrder: 2,
    description:
      "Nine volcanic islands in the mid-Atlantic, home to whale-watching " +
      "traditions, geothermal landscapes, and an emerging regenerative " +
      "tourism network.",
    dpi: null, // No DpiSnapshot seeded — admin triggers computation when ready
  },
  {
    name: "Alentejo",
    country: "Portugal",
    countryCode: "PRT",
    slug: "alentejo",
    isAvailable: false,
    displayOrder: 3,
    description:
      "Portugal's vast interior plains, known for cork oak forests, " +
      "dark sky reserves, and regenerative agriculture practices rooted " +
      "in centuries of land stewardship.",
    dpi: null,
  },
] as const;

async function main() {
  console.log("\n── Seeding database ─────────────────────────────────────────\n");

  // ── 1. Territories ─────────────────────────────────────────────────────────

  const territoryIds: Record<string, string> = {};

  for (const t of TERRITORIES) {
    const existing = await prisma.territory.findFirst({
      where: { slug: t.slug },
    });

    let territory;
    if (existing) {
      // Update availability and presentation fields in case they've changed.
      // DPI read model is NOT updated here — that is owned by the DPI orchestrator.
      territory = await prisma.territory.update({
        where: { id: existing.id },
        data: {
          name: t.name,
          country: t.country,
          countryCode: t.countryCode,
          slug: t.slug,
          isAvailable: t.isAvailable,
          displayOrder: t.displayOrder,
          description: t.description,
        },
      });
      log(`Territory updated:`, `${territory.name} (${t.isAvailable ? "available" : "coming soon"})`);
    } else {
      const dpiFields = t.dpi
        ? {
            touristIntensity: t.dpi.touristIntensity,
            ecologicalSensitivity: t.dpi.ecologicalSensitivity,
            economicLeakageRate: t.dpi.economicLeakageRate,
            regenerativePerformance: t.dpi.regenerativePerf,
            ...computeDpiComposite(t.dpi),
            compositeDpi: computeDpiComposite(t.dpi).composite,
            pressureLevel: computeDpiComposite(t.dpi).pressureLevel,
            operatorCohortSize: t.dpi.operatorCohortSize,
            dpiComputedAt: new Date(),
          }
        : {};

      territory = await prisma.territory.create({
        data: {
          name: t.name,
          country: t.country,
          countryCode: t.countryCode,
          slug: t.slug,
          isAvailable: t.isAvailable,
          displayOrder: t.displayOrder,
          description: t.description,
          ...dpiFields,
        },
      });
      log(`Territory created:`, `${territory.name} (${t.isAvailable ? "available" : "coming soon"})`);
    }

    territoryIds[t.slug] = territory.id;
  }

  // ── 2. Initial DpiSnapshot for Madeira ────────────────────────────────────
  // Creates the first immutable DPI record for Madeira. This serves as the
  // baseline until the admin triggers a proper recomputation via the DPI API.

  const madeiraDpiDef = TERRITORIES.find((t) => t.slug === "madeira")!.dpi!;
  const { composite: madeiraDpiComposite, pressureLevel: madeiraPressure } =
    computeDpiComposite(madeiraDpiDef);

  const existingMadeiraDpi = await prisma.dpiSnapshot.findFirst({
    where: { territoryId: territoryIds["madeira"] },
  });

  if (!existingMadeiraDpi) {
    const snapshotData = {
      territoryId: territoryIds["madeira"],
      touristIntensity: madeiraDpiDef.touristIntensity,
      ecologicalSensitivity: madeiraDpiDef.ecologicalSensitivity,
      economicLeakageRate: madeiraDpiDef.economicLeakageRate,
      regenerativePerf: madeiraDpiDef.regenerativePerf,
      compositeDpi: madeiraDpiComposite,
      pressureLevel: madeiraPressure,
      operatorCohortSize: madeiraDpiDef.operatorCohortSize,
      methodologyVersion: "1.0.0",
    };

    const snapshotHash = createHash("sha256")
      .update(JSON.stringify(snapshotData))
      .digest("hex");

    await prisma.dpiSnapshot.create({
      data: { ...snapshotData, snapshotHash },
    });
    log(`DPI snapshot created:`, `Madeira — DPI ${madeiraDpiComposite} (${madeiraPressure})`);
  } else {
    log(`DPI snapshot exists:`, `Madeira`);
  }

  // ── 3. Admin user ──────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@trt-local.dev" },
    update: {},
    create: { name: "Admin", email: "admin@trt-local.dev", passwordHash: adminHash },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: admin.id, role: "admin" } },
    update: {},
    create: { userId: admin.id, role: "admin" },
  });
  log("Admin user:", admin.email);

  // ── 4. Operator user + profile ─────────────────────────────────────────────

  const operatorHash = await bcrypt.hash("Operator1234!", 12);
  const operatorUser = await prisma.user.upsert({
    where: { email: "operator@trt-local.dev" },
    update: {},
    create: { name: "Seed Operator", email: "operator@trt-local.dev", passwordHash: operatorHash },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: operatorUser.id, role: "operator" } },
    update: {},
    create: { userId: operatorUser.id, role: "operator" },
  });
  await prisma.operator.upsert({
    where: { userId: operatorUser.id },
    update: {},
    create: {
      userId: operatorUser.id,
      legalName: "Quinta das Levadas Lda.",
      tradingName: "Quinta das Levadas",
      country: "Portugal",
      destinationRegion: "Madeira",
      territoryId: territoryIds["madeira"],
      operatorType: "A",
      operatorCode: "QDL-MAD-001",
      yearOperationStart: 2019,
      rooms: 8,
      bedCapacity: 16,
      ownershipType: "family",
      localEquityPct: 100.0,
      primaryContactName: "Seed Operator",
      primaryContactEmail: "operator@trt-local.dev",
    },
  });
  log("Operator user:", operatorUser.email);

  // ── 5. Traveler user + profile ─────────────────────────────────────────────

  const travelerHash = await bcrypt.hash("Traveler1234!", 12);
  const travelerUser = await prisma.user.upsert({
    where: { email: "traveler@trt-local.dev" },
    update: {},
    create: { name: "Seed Traveler", email: "traveler@trt-local.dev", passwordHash: travelerHash },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: travelerUser.id, role: "traveler" } },
    update: {},
    create: { userId: travelerUser.id, role: "traveler" },
  });
  await prisma.traveler.upsert({
    where: { userId: travelerUser.id },
    update: {},
    create: { userId: travelerUser.id, displayName: "Seed Traveler" },
  });
  log("Traveler user:", travelerUser.email);

  // ── 6. Methodology bundle ──────────────────────────────────────────────────

  const bundleHash = hashBundle(DEFAULT_METHODOLOGY_BUNDLE);
  await prisma.methodologyBundleRecord.upsert({
    where: { version: DEFAULT_METHODOLOGY_BUNDLE.version },
    update: {},
    create: {
      version: DEFAULT_METHODOLOGY_BUNDLE.version,
      publishedAt: new Date(DEFAULT_METHODOLOGY_BUNDLE.publishedAt),
      bundle: DEFAULT_METHODOLOGY_BUNDLE as object,
      bundleHash,
      isActive: true,
    },
  });
  log("Methodology bundle:", `v${DEFAULT_METHODOLOGY_BUNDLE.version}`);

  console.log("\n── Seed complete ────────────────────────────────────────────\n");
  console.log("  Destinations:");
  console.log("    Madeira          — available (DPI 77, high pressure)");
  console.log("    Azores           — coming soon");
  console.log("    Alentejo         — coming soon");
  console.log("\n  Credentials:");
  console.log("    admin@trt-local.dev       Admin1234!");
  console.log("    operator@trt-local.dev    Operator1234!");
  console.log("    traveler@trt-local.dev    Traveler1234!");
  console.log("");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
