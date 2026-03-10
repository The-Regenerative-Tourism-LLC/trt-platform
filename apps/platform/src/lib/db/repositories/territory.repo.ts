import { prisma } from "../prisma";
import type { Territory, Prisma } from "@prisma/client";

type TerritoryWithOperatorCount = Prisma.TerritoryGetPayload<{
  include: { _count: { select: { operators: true } } };
}>;

export async function createTerritory(
  data: Prisma.TerritoryCreateInput
): Promise<Territory> {
  return prisma.territory.create({ data });
}

export async function findOrCreateTerritory(params: {
  name: string;
  country?: string;
}): Promise<Territory> {
  const existing = await prisma.territory.findFirst({
    where: {
      name: { equals: params.name, mode: "insensitive" },
      ...(params.country ? { country: params.country } : {}),
    },
  });

  if (existing) return existing;

  return prisma.territory.create({
    data: { name: params.name, country: params.country },
  });
}

export async function findAllTerritories(): Promise<TerritoryWithOperatorCount[]> {
  return prisma.territory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { operators: true } } },
  });
}
