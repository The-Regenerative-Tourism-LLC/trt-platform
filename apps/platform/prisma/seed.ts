/**
 * Prisma Seed Script
 *
 * Creates the minimum data needed to run the app locally and in production.
 * Safe to run multiple times — all operations are idempotent (upsert/findFirst guards).
 *
 * What is ALWAYS seeded (core data):
 *   1. Territories (Madeira, Azores, Alentejo, Lisbon, Porto, Algarve)
 *   2. Initial DpiSnapshot for Madeira
 *   3. Methodology bundle v1.0.0
 *
 * What is seeded only when SEED_CREATE_USERS=true:
 *   4. Admin, operator, and traveler user accounts
 *
 * User passwords via environment variables (with local-dev fallbacks):
 *   SEED_ADMIN_PASSWORD    (fallback: Admin1234!)
 *   SEED_OPERATOR_PASSWORD (fallback: Operator1234!)
 *   SEED_TRAVELER_PASSWORD (fallback: Traveler1234!)
 *
 * Run with: npm run db:seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { DEFAULT_METHODOLOGY_BUNDLE } from "./methodology/default-bundle";

const prisma = new PrismaClient();

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SEED_CREATE_USERS = process.env.SEED_CREATE_USERS === "true";

// Passwords: require env vars in production, fall back to dev defaults locally.
const ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ??
  (IS_PRODUCTION ? null : "Admin1234!");

const OPERATOR_PASSWORD =
  process.env.SEED_OPERATOR_PASSWORD ??
  (IS_PRODUCTION ? null : "Operator1234!");

const TRAVELER_PASSWORD =
  process.env.SEED_TRAVELER_PASSWORD ??
  (IS_PRODUCTION ? null : "Traveler1234!");

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
    name: "Algarve",
    country: "Portugal",
    countryCode: "PRT",
    slug: "algarve",
    isAvailable: false,
    displayOrder: 3,
    description:
      "Portugal's southern coastline, known for its limestone cliffs, " +
      "golden beaches, and a growing movement toward regenerative coastal tourism.",
    dpi: null,
  },
  {
    name: "Lisbon",
    country: "Portugal",
    countryCode: "PRT",
    slug: "lisbon",
    isAvailable: false,
    displayOrder: 4,
    description:
      "Portugal's capital and cultural hub, blending historic neighbourhoods " +
      "with a vibrant urban regenerative hospitality scene.",
    dpi: null,
  },
  {
    name: "Porto",
    country: "Portugal",
    countryCode: "PRT",
    slug: "porto",
    isAvailable: false,
    displayOrder: 5,
    description:
      "A UNESCO-listed riverside city renowned for its wine culture, " +
      "independent hospitality scene, and community-rooted tourism operators.",
    dpi: null,
  },
  {
    name: "Alentejo",
    country: "Portugal",
    countryCode: "PRT",
    slug: "alentejo",
    isAvailable: false,
    displayOrder: 6,
    description:
      "Portugal's vast interior plains, known for cork oak forests, " +
      "dark sky reserves, and regenerative agriculture practices rooted " +
      "in centuries of land stewardship.",
    dpi: null,
  },
] as const;

async function seedCoreData(territoryIds: Record<string, string>) {
  // ── 1. Territories ──────────────────────────────────────────────────────────

  for (const t of TERRITORIES) {
    const dpiFields = t.dpi
      ? (() => {
          const { composite, pressureLevel } = computeDpiComposite(t.dpi);
          return {
            touristIntensity: t.dpi.touristIntensity,
            ecologicalSensitivity: t.dpi.ecologicalSensitivity,
            economicLeakageRate: t.dpi.economicLeakageRate,
            regenerativePerformance: t.dpi.regenerativePerf,
            compositeDpi: composite,
            pressureLevel,
            operatorCohortSize: t.dpi.operatorCohortSize,
            dpiComputedAt: new Date(),
          };
        })()
      : {};

    const territory = await prisma.territory.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        country: t.country,
        countryCode: t.countryCode,
        isAvailable: t.isAvailable,
        displayOrder: t.displayOrder,
        description: t.description,
      },
      create: {
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
    log(`Territory upserted:`, `${territory.name} (${t.isAvailable ? "available" : "coming soon"})`);

    territoryIds[t.slug] = territory.id;
  }

  // ── 2. Initial DpiSnapshot for Madeira ──────────────────────────────────────

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

  // ── 3. Methodology bundle ───────────────────────────────────────────────────

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
}

async function seedUsers(territoryIds: Record<string, string>) {
  if (!ADMIN_PASSWORD || !OPERATOR_PASSWORD || !TRAVELER_PASSWORD) {
    throw new Error(
      "SEED_CREATE_USERS=true requires SEED_ADMIN_PASSWORD, SEED_OPERATOR_PASSWORD, " +
      "and SEED_TRAVELER_PASSWORD to be set in production."
    );
  }

  // ── Admin user ──────────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@theregenerativetourism.com" },
    update: {},
    create: { name: "Admin", email: "admin@theregenerativetourism.com", passwordHash: adminHash },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: admin.id, role: "admin" } },
    update: {},
    create: { userId: admin.id, role: "admin" },
  });
  log("Admin user:", admin.email);

  // ── Operator user + profile ─────────────────────────────────────────────────

  const operatorHash = await bcrypt.hash(OPERATOR_PASSWORD, 12);
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

  // ── Traveler user + profile ─────────────────────────────────────────────────

  const travelerHash = await bcrypt.hash(TRAVELER_PASSWORD, 12);
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
}

async function main() {
  console.log("\n── Seeding database ─────────────────────────────────────────\n");
  console.log(`  NODE_ENV:          ${process.env.NODE_ENV ?? "not set"}`);
  console.log(`  SEED_CREATE_USERS: ${SEED_CREATE_USERS}`);
  console.log("");

  const territoryIds: Record<string, string> = {};

  await seedCoreData(territoryIds);

  if (SEED_CREATE_USERS) {
    console.log("\n  [Users]\n");
    await seedUsers(territoryIds);
  } else {
    log("Users:", "skipped (SEED_CREATE_USERS not set)");
  }

  console.log("\n── Seed complete ────────────────────────────────────────────\n");
  console.log("  Destinations:");
  console.log("    Madeira          — available (DPI 77, high pressure)");
  console.log("    Azores           — coming soon");
  console.log("    Algarve          — coming soon");
  console.log("    Lisbon           — coming soon");
  console.log("    Porto            — coming soon");
  console.log("    Alentejo         — coming soon");

  if (SEED_CREATE_USERS && !IS_PRODUCTION) {
    console.log("\n  Dev credentials:");
    console.log("    admin@theregenerativetourism.com    Admin1234!");
    console.log("    operator@trt-local.dev              Operator1234!");
    console.log("    traveler@trt-local.dev              Traveler1234!");
  } else if (SEED_CREATE_USERS) {
    console.log("\n  Users created with passwords from environment variables.");
  }

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
