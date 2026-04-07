/**
 * DPI Snapshot Repository
 *
 * Persistence of immutable DpiSnapshot records and Territory read models.
 */

import { prisma } from "../prisma";
import type { DpiSnapshot, Territory, Prisma, PressureLevel } from "@prisma/client";

export async function createDpiSnapshot(
  data: Prisma.DpiSnapshotCreateInput
): Promise<DpiSnapshot> {
  return prisma.dpiSnapshot.create({ data });
}

export async function findLatestDpiByTerritory(
  territoryId: string
): Promise<DpiSnapshot | null> {
  return prisma.dpiSnapshot.findFirst({
    where: { territoryId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findDpiSnapshotById(id: string): Promise<DpiSnapshot | null> {
  return prisma.dpiSnapshot.findUnique({ where: { id } });
}

export async function findTerritoryById(id: string): Promise<Territory | null> {
  return prisma.territory.findUnique({ where: { id } });
}

export async function findTerritoryByName(name: string): Promise<Territory | null> {
  return prisma.territory.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
}

export async function findAllTerritories(): Promise<Territory[]> {
  return prisma.territory.findMany({ orderBy: { name: "asc" } });
}

export async function findAvailableTerritories(): Promise<Territory[]> {
  return prisma.territory.findMany({
    where: { isAvailable: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function findMadeiraTerritoryId(): Promise<string | null> {
  const territory = await prisma.territory.findFirst({
    where: { name: { equals: "Madeira", mode: "insensitive" } },
    select: { id: true },
  });
  return territory?.id ?? null;
}

export async function upsertTerritoryDpiReadModel(
  territoryId: string,
  dpiData: {
    touristIntensity: number;
    ecologicalSensitivity: number;
    economicLeakageRate: number;
    regenerativePerformance: number;
    compositeDpi: number;
    pressureLevel: PressureLevel;
    operatorCohortSize: number;
    dpiComputedAt: Date;
  }
): Promise<Territory> {
  return prisma.territory.update({
    where: { id: territoryId },
    data: {
      touristIntensity: dpiData.touristIntensity,
      ecologicalSensitivity: dpiData.ecologicalSensitivity,
      economicLeakageRate: dpiData.economicLeakageRate,
      regenerativePerformance: dpiData.regenerativePerformance,
      compositeDpi: dpiData.compositeDpi,
      pressureLevel: dpiData.pressureLevel,
      operatorCohortSize: dpiData.operatorCohortSize,
      dpiComputedAt: dpiData.dpiComputedAt,
    },
  });
}
