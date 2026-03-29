import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { DiscoverClient } from "./DiscoverClient";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Browse verified regenerative tourism operators by score, territory, and pillar.",
};

export const dynamic = "force-dynamic";

async function getPublishedOperators() {
  return prisma.operator.findMany({
    where: {
      scoreSnapshots: { some: { isPublished: true } },
    },
    include: {
      scoreSnapshots: {
        where: { isPublished: true },
        orderBy: { computedAt: "desc" },
        take: 1,
      },
      territory: {
        select: {
          id: true,
          name: true,
          pressureLevel: true,
          compositeDpi: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getTerritories() {
  return prisma.territory.findMany({
    where: { name: { not: "Unassigned" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export default async function DiscoverPage() {
  const [operators, territories] = await Promise.all([
    getPublishedOperators(),
    getTerritories(),
  ]);

  const serialized = operators.map((op) => {
    const score = op.scoreSnapshots[0];
    return {
      id: op.id,
      tradingName: op.tradingName,
      legalName: op.legalName,
      destinationRegion: op.destinationRegion,
      country: op.country,
      operatorType: op.operatorType,
      gpsBand: score?.gpsBand ?? null,
      gpsTotal: score ? Number(score.gpsTotal) : null,
      p1Score: score ? Number(score.p1Score) : null,
      p2Score: score ? Number(score.p2Score) : null,
      p3Score: score ? Number(score.p3Score) : null,
      territory: op.territory
        ? {
            id: op.territory.id,
            name: op.territory.name,
            pressureLevel: op.territory.pressureLevel,
            compositeDpi: op.territory.compositeDpi
              ? Number(op.territory.compositeDpi)
              : null,
          }
        : null,
    };
  });

  return (
    <DiscoverClient
      operators={serialized}
      territories={territories}
    />
  );
}
