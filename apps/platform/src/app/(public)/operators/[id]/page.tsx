import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { GPS_BAND_CONFIG } from "@/lib/constants";
import { GPSCircle, GPSBandBadge, DPSBandBadge, PressureBadge } from "@/components/scoring/ScoreDisplays";
import type { GreenPassportBand, DpsBand } from "@/lib/engine/trt-scoring-engine/types";

// Each operator page is backed by a live DB read and generateMetadata also queries
// the DB. No generateStaticParams is defined, so this is already dynamic, but we
// make it explicit to prevent any future regression.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const operator = await prisma.operator.findUnique({
    where: { id },
    select: { tradingName: true, legalName: true },
  });
  if (!operator) return { title: "Operator Not Found" };
  return {
    title: `${operator.tradingName ?? operator.legalName} · Green Passport`,
  };
}

export default async function PublicGreenPassportPage({ params }: Props) {
  const { id } = await params;

  const operator = await prisma.operator.findUnique({
    where: { id },
    include: {
      territory: true,
      scoreSnapshots: {
        where: { isPublished: true },
        orderBy: { computedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!operator || !operator.scoreSnapshots[0]) {
    notFound();
  }

  const score = operator.scoreSnapshots[0];
  const gpsTotal = Number(score.gpsTotal);
  const gpsBand = score.gpsBand as GreenPassportBand;
  const config = GPS_BAND_CONFIG[gpsBand];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
            🌿 Verified Green Passport
          </div>
          <h1 className="text-4xl font-bold">
            {operator.tradingName ?? operator.legalName}
          </h1>
          {operator.destinationRegion && (
            <p className="text-muted-foreground">
              📍 {operator.destinationRegion}
              {operator.country ? `, ${operator.country}` : ""}
            </p>
          )}
        </div>

        {/* GPS Score */}
        <div className="rounded-2xl border bg-card p-8 flex flex-col items-center gap-4">
          <GPSCircle score={gpsTotal} band={gpsBand} size={160} />
          <GPSBandBadge band={gpsBand} />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {config.description}
          </p>
          {score.dpsBand && (
            <DPSBandBadge band={score.dpsBand as DpsBand} />
          )}
        </div>

        {/* Pillar breakdown */}
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Score Breakdown
          </p>
          <div className="space-y-3">
            {[
              { label: "P1 Operational Footprint", score: Number(score.p1Score), weight: 0.4, color: "bg-emerald-500" },
              { label: "P2 Local Integration", score: Number(score.p2Score), weight: 0.3, color: "bg-amber-500" },
              { label: "P3 Regenerative Contribution", score: Number(score.p3Score), weight: 0.3, color: "bg-teal-500" },
            ].map((p) => (
              <div key={p.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{p.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {p.score}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.color}`}
                    style={{ width: `${p.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Territory DPI */}
        {operator.territory?.compositeDpi != null && (
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Destination Context — {operator.territory.name}
              </p>
              {operator.territory.pressureLevel && (
                <PressureBadge level={operator.territory.pressureLevel} />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Destination Pressure Index:{" "}
              <span className="font-bold text-foreground">
                {Number(operator.territory.compositeDpi)}
              </span>
              . Choosing a high-GPS operator in a high-pressure destination is
              the highest-impact booking choice.
            </p>
          </div>
        )}

        {/* Methodology */}
        <div className="rounded-2xl border bg-muted/30 p-5 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Verification & Audit</p>
          <p>Methodology version: {score.methodologyVersion}</p>
          <p>
            Computed:{" "}
            {new Date(score.computedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p>
            Score snapshot ID: <span className="font-mono">{score.id}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
