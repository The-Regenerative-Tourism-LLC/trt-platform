import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { GPS_BAND_CONFIG, DPS_BAND_CONFIG } from "@/lib/constants";
import { Search, MapPin, Filter, Leaf } from "lucide-react";
import type { GreenPassportBand, DpsBand } from "@/lib/engine/trt-scoring-engine/types";

function buildPublicStorageUrl(storageKey: string): string {
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  if (base) return `${base}/${storageKey}`;
  return `/uploads/${storageKey}`;
}

export const metadata: Metadata = {
  title: "Verified Regenerative Operators · Green Passport",
  description:
    "Browse and compare verified regenerative tourism operators with GPS scores.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    q?: string;
    band?: string;
    territory?: string;
    sort?: string;
  }>;
}

const BAND_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "regenerative_leader", label: "Regenerative Leader", color: "bg-primary" },
  { value: "regenerative_practice", label: "Regenerative Practice", color: "bg-primary/80" },
  { value: "advancing", label: "Advancing", color: "bg-primary/60" },
  { value: "developing", label: "Developing", color: "bg-muted-foreground" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "score", label: "Highest Score" },
  { value: "name", label: "Name A–Z" },
];

function bandBgClass(band: GreenPassportBand): string {
  const map: Record<GreenPassportBand, string> = {
    regenerative_leader: "bg-primary",
    regenerative_practice: "bg-primary/80",
    advancing: "bg-primary/60",
    developing: "bg-muted-foreground",
    not_yet_published: "bg-muted-foreground/60",
  };
  return map[band] ?? "bg-muted-foreground/60";
}

function pressureTextClass(level: string | null): string {
  if (level === "high") return "text-destructive";
  if (level === "moderate") return "text-[hsl(var(--trt-amber))]";
  return "text-accent";
}

export default async function PublicOperatorsPage({ searchParams }: Props) {
  const { q, band, territory, sort } = await searchParams;

  const territories = await prisma.territory.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const operators = await prisma.operator.findMany({
    where: {
      scoreSnapshots: { some: { isPublished: true } },
      AND: [
        q
          ? {
              OR: [
                { legalName: { contains: q, mode: "insensitive" } },
                { tradingName: { contains: q, mode: "insensitive" } },
                { destinationRegion: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        territory ? { territoryId: territory } : {},
        band
          ? {
              scoreSnapshots: {
                some: { isPublished: true, gpsBand: band as GreenPassportBand },
              },
            }
          : {},
      ],
    },
    include: {
      scoreSnapshots: {
        where: { isPublished: true },
        orderBy: { computedAt: "desc" },
        take: 1,
      },
      territory: {
        select: { id: true, name: true, pressureLevel: true },
      },
      operatorPhotos: {
        where: { isCover: true },
        take: 1,
        select: { storageKey: true },
      },
    },
    take: 50,
    orderBy: sort === "name" ? { legalName: "asc" } : { updatedAt: "desc" },
  });

  const sorted =
    sort === "score"
      ? [...operators].sort((a, b) => {
          const aScore = a.scoreSnapshots[0] ? Number(a.scoreSnapshots[0].gpsTotal) : 0;
          const bScore = b.scoreSnapshots[0] ? Number(b.scoreSnapshots[0].gpsTotal) : 0;
          return bScore - aScore;
        })
      : operators;

  const activeFilters = [q, band, territory].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <Image
          src="/assets/hero-landscape.jpg"
          alt="Verified Regenerative Operators"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/70 to-black/85" />
        <div className="relative z-10 container mx-auto max-w-7xl py-14 md:py-24 px-5 md:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/60 text-sm px-4 py-1.5 rounded-full">
            <Leaf className="h-3.5 w-3.5" />
            Verified by Green Passport
          </div>
          <h1 className="text-2xl md:text-[3rem] font-bold tracking-tight leading-[1.05]">
            Verified Regenerative Operators
          </h1>
          <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
            Every operator listed here has been independently assessed across three
            pillars of regenerative impact. Scores are computed, not claimed.
          </p>
          <p className="text-white/50 text-sm">
            {sorted.length === 0
              ? "No operators match your filters"
              : `${sorted.length} operator${sorted.length !== 1 ? "s" : ""} with published GPS scores`}
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-5 md:px-6 py-8 md:py-12 space-y-8">
        {/* Filter bar */}
        <form
          method="GET"
          className="rounded-2xl border bg-card p-5 flex flex-wrap gap-4 items-end shadow-sm"
        >
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q ?? ""}
                placeholder="Search operators, regions..."
                className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label htmlFor="band" className="text-xs font-medium text-muted-foreground">
              GPS Band
            </label>
            <select
              id="band"
              name="band"
              defaultValue={band ?? ""}
              className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All bands</option>
              {BAND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label htmlFor="territory" className="text-xs font-medium text-muted-foreground">
              Territory
            </label>
            <select
              id="territory"
              name="territory"
              defaultValue={territory ?? ""}
              className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All territories</option>
              {territories.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label htmlFor="sort" className="text-xs font-medium text-muted-foreground">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sort ?? "recent"}
              className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Filter className="h-3.5 w-3.5" />
            Apply
          </button>
        </form>

        {/* Active filters */}
        {activeFilters > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filters active:</span>
            {q && (
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">
                &ldquo;{q}&rdquo;
              </span>
            )}
            {band && (
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                {band.replace(/_/g, " ")}
              </span>
            )}
            {territory && (
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-medium">
                {territories.find((t) => t.id === territory)?.name ?? territory}
              </span>
            )}
            <Link
              href="/operators"
              className="text-xs text-accent hover:underline ml-1"
            >
              Clear all
            </Link>
          </div>
        )}

        {/* Results */}
        {sorted.length === 0 ? (
          <div className="rounded-2xl border bg-card p-16 text-center space-y-4">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-lg font-semibold">No operators found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
            <Link
              href="/operators"
              className="inline-flex mt-2 text-sm text-accent hover:underline"
            >
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((op) => {
              const score = op.scoreSnapshots[0];
              if (!score) return null;

              const gpsTotal = Number(score.gpsTotal);
              const gpsBand = score.gpsBand as GreenPassportBand;
              const config = GPS_BAND_CONFIG[gpsBand];
              const dpsBand = score.dpsBand ? (score.dpsBand as DpsBand) : null;
              const dpsConfig = dpsBand ? DPS_BAND_CONFIG[dpsBand] : null;

              return (
                <Link
                  key={op.id}
                  href={`/operators/${op.id}`}
                  className="group rounded-lg border border-border bg-card hover:shadow-sm transition-all overflow-hidden flex flex-col card-interactive"
                >
                  {/* Cover image — prefer new OperatorPhoto source, fall back to legacy field */}
                  {(op.operatorPhotos[0]?.storageKey ?? op.coverPhotoUrl) ? (
                    <div
                      className="h-40 w-full bg-cover bg-center group-hover:scale-[1.02] transition-transform duration-500"
                      style={{ backgroundImage: `url(${op.operatorPhotos[0]?.storageKey ? buildPublicStorageUrl(op.operatorPhotos[0].storageKey) : op.coverPhotoUrl})` }}
                    />
                  ) : (
                    <div className="h-40 w-full bg-secondary flex items-center justify-center">
                      <Leaf className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="p-5 flex flex-col gap-3 flex-1">
                    {/* Name + GPS */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                          {op.tradingName ?? op.legalName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {op.destinationRegion}
                          {op.country ? `, ${op.country}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-black tabular-nums leading-none">
                          {gpsTotal}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          GPS
                        </div>
                      </div>
                    </div>

                    {/* Tagline */}
                    {op.tagline && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2">
                        {op.tagline}
                      </p>
                    )}

                    {/* Pillar mini bars */}
                    <div className="space-y-1.5 mt-auto">
                      {[
                        { label: "P1", score: Number(score.p1Score), color: "bg-[hsl(var(--gps-footprint))]" },
                        { label: "P2", score: Number(score.p2Score), color: "bg-[hsl(var(--gps-local))]" },
                        { label: "P3", score: Number(score.p3Score), color: "bg-[hsl(var(--gps-regen))]" },
                      ].map((p) => (
                        <div key={p.label} className="flex items-center gap-2">
                          <span className="text-[10px] w-5 text-muted-foreground font-medium">
                            {p.label}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.color}`}
                              style={{ width: `${p.score}%` }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right">
                            {p.score}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span
                        className={`text-xs text-white font-semibold px-2.5 py-1 rounded-full ${bandBgClass(gpsBand)}`}
                      >
                        {config.label}
                      </span>
                      {dpsConfig && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border text-muted-foreground">
                          {dpsConfig.arrow} {dpsConfig.label}
                        </span>
                      )}
                    </div>

                    {/* Territory + DPI */}
                    {op.territory && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {op.territory.name}
                        {op.territory.pressureLevel && (
                          <span
                            className={`ml-1 font-medium ${pressureTextClass(op.territory.pressureLevel)}`}
                          >
                            · {op.territory.pressureLevel} DPI
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
