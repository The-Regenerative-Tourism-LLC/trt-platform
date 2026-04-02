/**
 * ARCHITECTURE: Database client singleton — server-side only.
 *
 * This module must ONLY be imported by:
 *   - API routes (app/api/)
 *   - Repositories (lib/db/repositories/)
 *   - Server components (runtime only, never during static generation)
 *   - Orchestrators (lib/orchestration/)
 *   - Background workers
 *
 * This module must NEVER be imported by:
 *   - Client components ("use client")
 *   - The scoring engine (lib/engine/)
 *   - Snapshot builders (lib/snapshots/)
 *   - Frontend hooks, stores, or UI components
 *   - Static generation functions (generateStaticParams)
 *
 * Snapshot tables (assessment_snapshots, dpi_snapshots, score_snapshots) are
 * append-only — rows must never be updated or deleted.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
