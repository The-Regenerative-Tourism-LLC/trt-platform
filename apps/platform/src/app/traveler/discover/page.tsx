import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { DiscoverClient } from "./DiscoverClient";

function buildPublicStorageUrl(storageKey: string): string {
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  if (base) return `${base}/${storageKey}`;
  return `/uploads/${storageKey}`;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover Regenerative Operators · Green Passport",
};

export default async function DiscoverPage() {
  const [rawOperators, territories] = await Promise.all([
    prisma.operator.findMany({
      where: {
        isPublished: true,
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
        activities: {
          where: { isActive: true },
          take: 3,
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true,
          },
        },
        operatorPhotos: {
          where: { isCover: true },
          take: 1,
          select: { storageKey: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 24,
    }),
    prisma.territory.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize: Decimal → number, Date → ISO string
  const operators = rawOperators.map((op) => ({
    id: op.id,
    legalName: op.legalName,
    tradingName: op.tradingName ?? null,
    destinationRegion: op.destinationRegion ?? null,
    country: op.country ?? null,
    coverPhotoUrl: op.operatorPhotos[0]?.storageKey
      ? buildPublicStorageUrl(op.operatorPhotos[0].storageKey)
      : (op.coverPhotoUrl ?? null),
    territory: op.territory
      ? {
          id: op.territory.id,
          name: op.territory.name,
          pressureLevel: op.territory.pressureLevel ?? null,
          compositeDpi: op.territory.compositeDpi
            ? Number(op.territory.compositeDpi)
            : null,
        }
      : null,
    activities: op.activities.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      difficulty: a.difficulty,
    })),
    score: op.scoreSnapshots[0]
      ? {
          gpsTotal: Number(op.scoreSnapshots[0].gpsTotal),
          gpsBand: op.scoreSnapshots[0].gpsBand,
          dpsTotal: op.scoreSnapshots[0].dpsTotal
            ? Number(op.scoreSnapshots[0].dpsTotal)
            : null,
          dpsBand: op.scoreSnapshots[0].dpsBand ?? null,
          computedAt: op.scoreSnapshots[0].computedAt.toISOString(),
        }
      : null,
  }));

  return (
    <DiscoverClient operators={operators} territories={territories} />
  );
}
