/**
 * Prisma Seed Script
 *
 * Creates the minimum data needed to run the app locally and in staging.
 * Safe to run multiple times — all operations are idempotent.
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function hashBundle(bundle: typeof DEFAULT_METHODOLOGY_BUNDLE): string {
  const canonical = JSON.stringify(bundle, Object.keys(bundle).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

function log(label: string, value: string) {
  console.log(`  ${label.padEnd(30)} ${value}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n── Seeding database ─────────────────────────────────────────\n");

  // ── 1. Territory ───────────────────────────────────────────────────────────

  let territory = await prisma.territory.findFirst({
    where: { name: "Costa Rica Highlands" },
  });

  if (!territory) {
    territory = await prisma.territory.create({
      data: {
        name: "Costa Rica Highlands",
        country: "Costa Rica",
        touristIntensity: 65.0,
        ecologicalSensitivity: 78.0,
        economicLeakageRate: 42.0,
        regenerativePerformance: 55.0,
        compositeDpi: 57.5,
        pressureLevel: "moderate",
        operatorCohortSize: 1,
        dpiComputedAt: new Date(),
      },
    });
    log("Territory created:", territory.name);
  } else {
    log("Territory exists:", territory.name);
  }

  // ── 2. DPI Snapshot ────────────────────────────────────────────────────────

  const existingDpi = await prisma.dpiSnapshot.findFirst({
    where: { territoryId: territory.id },
  });

  if (!existingDpi) {
    await prisma.dpiSnapshot.create({
      data: {
        territoryId: territory.id,
        touristIntensity: 65.0,
        ecologicalSensitivity: 78.0,
        economicLeakageRate: 42.0,
        regenerativePerf: 55.0,
        compositeDpi: 57.5,
        pressureLevel: "moderate",
        operatorCohortSize: 1,
      },
    });
    log("DPI snapshot created:", territory.name);
  } else {
    log("DPI snapshot exists:", territory.name);
  }

  // ── 3. Admin user ──────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash("Admin1234!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@trt-local.dev" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@trt-local.dev",
      passwordHash: adminHash,
    },
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
    create: {
      name: "Seed Operator",
      email: "operator@trt-local.dev",
      passwordHash: operatorHash,
    },
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
      legalName: "Seed Lodge Costa Rica S.A.",
      tradingName: "Seed Lodge",
      country: "Costa Rica",
      territoryId: territory.id,
      operatorType: "A",
      operatorCode: "SEED-CRI-001",
      yearOperationStart: 2018,
      rooms: 12,
      bedCapacity: 24,
      ownershipType: "independent",
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
    create: {
      name: "Seed Traveler",
      email: "traveler@trt-local.dev",
      passwordHash: travelerHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_role: { userId: travelerUser.id, role: "traveler" } },
    update: {},
    create: { userId: travelerUser.id, role: "traveler" },
  });

  await prisma.traveler.upsert({
    where: { userId: travelerUser.id },
    update: {},
    create: {
      userId: travelerUser.id,
      displayName: "Seed Traveler",
    },
  });

  log("Traveler user:", travelerUser.email);

  // ── 6. Methodology bundle record ───────────────────────────────────────────
  // Seeds the default bundle into the DB for Phase 2 (DB-driven bundle loading).
  // The loader currently falls back to the compiled default — this is future-proofing.

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
  console.log("  Credentials:");
  console.log("    admin@trt-local.dev      Admin1234!");
  console.log("    operator@trt-local.dev   Operator1234!");
  console.log("    traveler@trt-local.dev   Traveler1234!");
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
