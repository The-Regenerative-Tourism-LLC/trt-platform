import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { GPS_BAND_CONFIG, DPS_BAND_CONFIG, PRESSURE_CONFIG, OPERATOR_TYPES } from "@/lib/constants";
import { GPSCircle, GPSBandBadge, DPSBandBadge, PressureBadge, PillarBar } from "@/components/scoring/ScoreDisplays";
import { MapPin, Calendar, Shield, ExternalLink, Leaf, ArrowLeft, CheckCircle2, Globe, TrendingUp } from "lucide-react";
import type { GreenPassportBand, DpsBand } from "@/lib/engine/trt-scoring-engine/types";
import { JsonLd, operatorSchema } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

function buildPublicStorageUrl(storageKey: string): string {
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  if (base) return `${base}/${storageKey}`;
  // Local dev: served via /uploads/[...path] route
  return `/uploads/${storageKey}`;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const operator = await prisma.operator.findUnique({
    where: { id },
    select: { tradingName: true, legalName: true, destinationRegion: true },
  });
  if (!operator) return { title: "Operator Not Found", robots: { index: false } };
  const name = operator.tradingName ?? operator.legalName;
  const description = `Verified regenerative tourism profile for ${name}${operator.destinationRegion ? ` in ${operator.destinationRegion}` : ""}. GPS score, pillar breakdown, and audit trail.`;
  return {
    title: name,
    description,
    alternates: { canonical: `/operators/${id}` },
    openGraph: {
      title: `${name} · Green Passport`,
      description,
      url: `/operators/${id}`,
      type: "profile",
      images: [{ url: `/operators/${id}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} · Green Passport`,
      description,
      images: [`/operators/${id}/opengraph-image`],
    },
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
        take: 5,
      },
      forwardCommitmentRecords: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      operatorPhotos: {
        where: { isCover: true },
        take: 1,
        select: { storageKey: true },
      },
    },
  });

  // Load verified evidence for the latest published assessment (public-safe fields only)
  const latestPublishedScore = operator?.scoreSnapshots[0] ?? null;
  const verifiedEvidence = latestPublishedScore
    ? await prisma.evidenceRef.findMany({
        where: {
          assessmentSnapshotId: latestPublishedScore.assessmentSnapshotId,
          verificationState: "verified",
        },
        select: {
          indicatorId: true,
          tier: true,
          verifiedAt: true,
        },
        orderBy: { indicatorId: "asc" },
      })
    : [];

  if (!operator || !operator.scoreSnapshots[0]) {
    notFound();
  }

  const score = operator.scoreSnapshots[0];

  // Resolve cover photo: prefer new OperatorPhoto source, fall back to legacy field
  const coverStorageKey = operator.operatorPhotos[0]?.storageKey ?? null;
  const coverPhotoUrl = coverStorageKey
    ? buildPublicStorageUrl(coverStorageKey)
    : (operator.coverPhotoUrl ?? null);

  const gpsTotal = Number(score.gpsTotal);
  const gpsBand = score.gpsBand as GreenPassportBand;
  const config = GPS_BAND_CONFIG[gpsBand];
  const dpsBand = score.dpsBand ? (score.dpsBand as DpsBand) : null;
  const dpsConfig = dpsBand ? DPS_BAND_CONFIG[dpsBand] : null;
  const operatorType = OPERATOR_TYPES[operator.operatorType ?? ""] ?? null;
  const fcr = operator.forwardCommitmentRecords[0] ?? null;

  const p1 = Number(score.p1Score);
  const p2 = Number(score.p2Score);
  const p3 = Number(score.p3Score);
  const dpsTotal = score.dpsTotal ? Number(score.dpsTotal) : null;

  const operatorName = operator.tradingName ?? operator.legalName ?? "";

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        schema={operatorSchema({
          id,
          name: operatorName,
          region: operator.destinationRegion,
          gps: Number(score.gpsTotal),
          band: score.gpsBand,
          url: operator.website,
        })}
      />
      {/* Hero / Cover */}
      <section className="relative">
        {coverPhotoUrl ? (
          <div className="h-64 md:h-80 w-full relative overflow-hidden">
            <Image
              src={coverPhotoUrl}
              alt="Operator cover"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/60 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-80 w-full relative overflow-hidden">
            <Image
              src="/assets/hero-landscape.jpg"
              alt="Operator"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/60 to-[#1C1C1C]/20" />
          </div>
        )}

        {/* Back button overlay */}
        <div className="absolute top-4 left-4">
          <Link
            href="/operators"
            className="inline-flex items-center gap-1.5 bg-card/90 backdrop-blur-sm text-sm font-medium px-3 py-1.5 rounded-full hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Operators
          </Link>
        </div>

        {/* GPS score overlay */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="bg-card rounded-lg shadow-sm p-4 flex items-center gap-4">
            <GPSCircle score={gpsTotal} band={gpsBand} size={100} />
            <div className="hidden sm:block">
              <GPSBandBadge band={gpsBand} />
              {dpsBand && dpsConfig && (
                <div className="mt-1.5">
                  <DPSBandBadge band={dpsBand} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 space-y-8">
        {/* Operator identity */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            <Leaf className="h-3 w-3" />
            Verified Green Passport
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {operator.tradingName ?? operator.legalName}
          </h1>
          <div className="flex items-center justify-center gap-3 text-muted-foreground text-sm flex-wrap">
            {operator.destinationRegion && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {operator.destinationRegion}
                {operator.country ? `, ${operator.country}` : ""}
              </span>
            )}
            {operatorType && (
              <span className="flex items-center gap-1">
                · {operatorType.label}
              </span>
            )}
          </div>
          {operator.tagline && (
            <p className="text-muted-foreground italic max-w-xl mx-auto">
              {operator.tagline}
            </p>
          )}
        </div>

        {/* Score breakdown */}
        <div className="rounded-lg border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              Green Passport Score
            </h2>
            <span className="text-xs text-muted-foreground">
              GPS {gpsTotal}/100
            </span>
          </div>

          <div className="space-y-5">
            <PillarBar
              label="P1 Operational Footprint"
              score={p1}
              weight={0.4}
              colorClass="bg-[hsl(var(--gps-footprint))]"
            />
            <PillarBar
              label="P2 Local Integration"
              score={p2}
              weight={0.3}
              colorClass="bg-[hsl(var(--gps-local))]"
            />
            <PillarBar
              label="P3 Regenerative Contribution"
              score={p3}
              weight={0.3}
              colorClass="bg-[hsl(var(--gps-regen))]"
            />
          </div>

          {/* Pillar explanations */}
          <div className="grid md:grid-cols-3 gap-4 pt-2">
            {[
              {
                label: "Operational Footprint",
                score: p1,
                description: "Energy, water, waste, carbon, and land use intensity per activity unit.",
                color: "border-border bg-secondary/50",
              },
              {
                label: "Local Integration",
                score: p2,
                description: "Employment, procurement, revenue retention, and community engagement.",
                color: "border-border bg-secondary/50",
              },
              {
                label: "Regenerative Contribution",
                score: p3,
                description: "Active ecological, cultural, or scientific contribution with institutional traceability.",
                color: "border-border bg-secondary/50",
              },
            ].map((pillar) => (
              <div
                key={pillar.label}
                className={`rounded-xl border p-4 ${pillar.color}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold">{pillar.label}</span>
                  <span className="text-sm font-bold tabular-nums">{pillar.score}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* DPS — Direction of Travel */}
        {dpsTotal != null && dpsBand && dpsConfig && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Direction of Travel
              </h2>
              <DPSBandBadge band={dpsBand} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black tabular-nums">
                {dpsTotal > 0 ? "+" : ""}{dpsTotal}
              </span>
              <p className="text-sm text-muted-foreground">
                This operator is <strong className="text-foreground">{dpsConfig.label.toLowerCase()}</strong>
                {" "}— measuring how fast and consistently they improve across assessment cycles.
              </p>
            </div>
            {score.dps1 != null && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Rate of Improvement", value: Number(score.dps1) },
                  { label: "Consistency", value: score.dps2 ? Number(score.dps2) : null },
                  { label: "P3 Acceleration", value: score.dps3 ? Number(score.dps3) : null },
                ].map((d) => (
                  <div key={d.label} className="rounded-xl bg-muted p-3 text-center">
                    <span className="text-lg font-bold tabular-nums">
                      {d.value != null ? (d.value > 0 ? `+${d.value}` : d.value) : "—"}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{d.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Forward Commitment */}
        {fcr && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-6 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">
                Forward Commitment — Pillar 3 In Development
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This operator has formally committed to establishing a regenerative contribution programme.
              Category: <strong>{fcr.preferredCategory}</strong>.
              Status: <strong className="capitalize">{fcr.status}</strong>.
            </p>
          </div>
        )}

        {/* DPI — Destination Context */}
        {operator.territory?.compositeDpi != null && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Destination Context — {operator.territory.name}
              </h2>
              {operator.territory.pressureLevel && (
                <PressureBadge level={operator.territory.pressureLevel} />
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black tabular-nums">
                {Number(operator.territory.compositeDpi)}
              </span>
              <div className="text-sm text-muted-foreground flex-1">
                <p>
                  Destination Pressure Index measures the ecological and social pressure this
                  destination is under.{" "}
                  <strong className="text-foreground">
                    Choosing a high-GPS operator in a high-pressure destination is the
                    highest-impact booking choice.
                  </strong>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Tourist Intensity", value: operator.territory.touristIntensity, weight: "35%" },
                { label: "Ecological Sensitivity", value: operator.territory.ecologicalSensitivity, weight: "30%" },
                { label: "Economic Leakage", value: operator.territory.economicLeakageRate, weight: "20%" },
                { label: "Regen. Performance", value: operator.territory.regenerativePerformance, weight: "15%" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-muted p-3 text-center">
                  <span className="text-lg font-bold tabular-nums">{m.value != null ? Number(m.value) : "—"}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {m.label} ({m.weight})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score History (if multiple cycles) */}
        {operator.scoreSnapshots.length > 1 && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              Assessment History
            </h2>
            <div className="space-y-3">
              {operator.scoreSnapshots.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    i === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {i === 0 ? "Current" : `Cycle ${operator.scoreSnapshots.length - i}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.computedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black tabular-nums">{Number(s.gpsTotal)}</span>
                    <p className="text-xs text-muted-foreground capitalize">
                      {(s.gpsBand as string).replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Summary */}
        {verifiedEvidence.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">Verified Evidence</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {verifiedEvidence.length} item{verifiedEvidence.length !== 1 ? "s" : ""} verified
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {verifiedEvidence.map((e) => {
                const pillar = e.indicatorId.startsWith("p1_")
                  ? { label: "P1", color: "bg-secondary text-foreground border-border" }
                  : e.indicatorId.startsWith("p2_")
                  ? { label: "P2", color: "bg-secondary text-foreground border-border" }
                  : e.indicatorId.startsWith("p3_")
                  ? { label: "P3", color: "bg-secondary text-foreground border-border" }
                  : { label: "—", color: "bg-muted text-muted-foreground border-border" };

                const tierColors: Record<string, string> = {
                  T1: "bg-primary text-primary-foreground",
                  T2: "bg-primary/70 text-primary-foreground",
                  T3: "bg-primary/50 text-primary-foreground",
                  Proxy: "bg-muted-foreground text-background",
                };

                return (
                  <div
                    key={`${e.indicatorId}-${e.verifiedAt?.toISOString() ?? ""}`}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs ${pillar.color}`}
                  >
                    <span className="font-semibold shrink-0">{pillar.label}</span>
                    <span className="truncate flex-1 font-mono text-[10px]">
                      {e.indicatorId.replace(/_/g, " ")}
                    </span>
                    {e.tier && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${tierColors[e.tier] ?? "bg-muted-foreground/60 text-background"}`}
                      >
                        {e.tier}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Indicator evidence has been reviewed and verified by a TRT assessor.
              Tier 1 = primary source documents · Tier 2 = secondary data · Tier 3 = institutional partnership records.
            </p>
          </div>
        )}

        {/* Verification & Audit */}
        <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Verification & Audit</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Methodology:</span>{" "}
              {score.methodologyVersion}
            </p>
            <p>
              <span className="font-medium text-foreground">Computed:</span>{" "}
              {new Date(score.computedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="sm:col-span-2">
              <span className="font-medium text-foreground">Snapshot ID:</span>{" "}
              <span className="font-mono">{score.id}</span>
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
            This score is computed by the TRT Scoring Engine — a deterministic, stateless computation
            layer. Any GPS can be independently reproduced by passing the source AssessmentSnapshot and
            MethodologyBundle to the engine. Scores displayed here are read from persisted ScoreSnapshots,
            never computed on-the-fly.
          </p>
        </div>
      </div>
    </div>
  );
}
