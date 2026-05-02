"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GPS_BAND_CONFIG, OPERATOR_TYPES } from "@/lib/constants";
import type { GreenPassportBand } from "@/lib/engine/trt-scoring-engine/types";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  ArrowUpDown,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface Operator {
  id: string;
  tradingName: string | null;
  legalName: string;
  destinationRegion: string | null;
  country: string | null;
  operatorType: string | null;
  gpsBand: string | null;
  gpsTotal: number | null;
  p1Score: number | null;
  p2Score: number | null;
  p3Score: number | null;
  territory: {
    id: string;
    name: string;
    pressureLevel: string | null;
    compositeDpi: number | null;
  } | null;
}

interface Territory {
  id: string;
  name: string;
}

type SortOption = "score_desc" | "score_asc" | "name_asc";
type TabKey = "all" | "stay" | "experiences";

export function DiscoverClient({
  operators,
  territories,
}: {
  operators: Operator[];
  territories: Territory[];
}) {
  const t = useTranslations("public.discover");

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "score_desc", label: t("sort.scoreDesc") },
    { value: "score_asc", label: t("sort.scoreAsc") },
    { value: "name_asc", label: t("sort.nameAsc") },
  ];

  const TABS: { key: TabKey; label: string }[] = [
    { key: "all", label: t("tabs.all") },
    { key: "stay", label: t("tabs.stay") },
    { key: "experiences", label: t("tabs.experiences") },
  ];

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("score_desc");
  const [activeTabKey, setActiveTabKey] = useState<TabKey>("all");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("");
  const [selectedBand, setSelectedBand] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...operators];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (op) =>
          (op.tradingName || op.legalName).toLowerCase().includes(q) ||
          (op.destinationRegion || "").toLowerCase().includes(q)
      );
    }

    if (selectedTerritory) {
      result = result.filter((op) => op.territory?.id === selectedTerritory);
    }

    if (selectedBand) {
      result = result.filter((op) => op.gpsBand === selectedBand);
    }

    if (activeTabKey === "stay") {
      result = result.filter(
        (op) => op.operatorType === "A" || op.operatorType === "C"
      );
    } else if (activeTabKey === "experiences") {
      result = result.filter(
        (op) => op.operatorType === "B" || op.operatorType === "C"
      );
    }

    result.sort((a, b) => {
      if (sort === "score_desc")
        return (b.gpsTotal ?? 0) - (a.gpsTotal ?? 0);
      if (sort === "score_asc")
        return (a.gpsTotal ?? 0) - (b.gpsTotal ?? 0);
      return (a.tradingName || a.legalName).localeCompare(
        b.tradingName || b.legalName
      );
    });

    return result;
  }, [operators, search, sort, selectedTerritory, selectedBand, activeTabKey]);

  const hasActiveFilters = !!selectedTerritory || !!selectedBand;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="/assets/discover-hero-seixal.jpg"
          alt="Discover operators"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1C]/60 via-[#1C1C1C]/70 to-[#1C1C1C]/85" />
        <div className="relative z-10 container mx-auto max-w-7xl px-5 md:px-6 py-14 md:py-24 space-y-4">
          <p className="editorial-label text-white/50">{t("hero.label")}</p>
          <h1 className="text-2xl md:text-[3rem] font-bold tracking-tight leading-[1.05] max-w-2xl text-white">
            {t("hero.title")}
          </h1>
          <p className="text-sm text-white/50 max-w-lg leading-relaxed">
            {t("hero.description")}
          </p>
        </div>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto max-w-7xl px-5 md:px-6">
          {/* Tabs + search */}
          <div className="flex items-center gap-4 py-3">
            <div className="flex items-center gap-1 border border-border rounded-full overflow-hidden bg-card">
              {TABS.map((tabItem) => (
                <button
                  key={tabItem.key}
                  onClick={() => setActiveTabKey(tabItem.key)}
                  className={`px-4 py-1.5 text-xs font-medium transition-all ${
                    activeTabKey === tabItem.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("search.placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-border bg-card h-9 text-sm"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                hasActiveFilters
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t("filters.button")}
              {hasActiveFilters && (
                <span className="w-4 h-4 bg-background text-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                  {(selectedTerritory ? 1 : 0) + (selectedBand ? 1 : 0)}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="pb-3 flex flex-wrap gap-3 items-end border-t border-border/50 pt-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                  {t("filters.territory")}
                </label>
                <select
                  value={selectedTerritory}
                  onChange={(e) => setSelectedTerritory(e.target.value)}
                  className="h-8 px-3 text-xs border border-border rounded bg-card focus:outline-none"
                >
                  <option value="">{t("filters.allTerritories")}</option>
                  {territories.map((terr) => (
                    <option key={terr.id} value={terr.id}>
                      {terr.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                  {t("filters.band")}
                </label>
                <select
                  value={selectedBand}
                  onChange={(e) => setSelectedBand(e.target.value)}
                  className="h-8 px-3 text-xs border border-border rounded bg-card focus:outline-none"
                >
                  <option value="">{t("filters.allBands")}</option>
                  {Object.entries(GPS_BAND_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSelectedTerritory("");
                    setSelectedBand("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> {t("filters.clear")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto max-w-7xl py-8 md:py-12 px-5 md:px-6">
        <p className="text-xs text-muted-foreground mb-6">
          {t("results.count", { count: filtered.length })}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 text-sm">
            {t("results.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filtered.map((op) => (
              <OperatorCard key={op.id} operator={op} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function OperatorCard({ operator: op }: { operator: Operator }) {
  const t = useTranslations("public.discover");
  const gpsBand = op.gpsBand as GreenPassportBand | null;
  const bandConfig = gpsBand ? GPS_BAND_CONFIG[gpsBand] : null;
  const typeConfig = op.operatorType
    ? OPERATOR_TYPES[op.operatorType]
    : null;

  const pillars = [
    { label: t("pillars.footprint"), value: op.p1Score, color: "hsl(var(--gps-footprint))" },
    { label: t("pillars.local"), value: op.p2Score, color: "hsl(var(--gps-local))" },
    { label: t("pillars.regen"), value: op.p3Score, color: "hsl(var(--gps-regen))" },
  ];

  return (
    <Link
      href={`/operators/${op.id}`}
      className="border border-border rounded-xl overflow-hidden card-interactive block"
    >
      {/* Score header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--navy)), hsl(80 15% 22%))",
        }}
      >
        <div>
          <p className="font-bold text-white text-sm leading-tight">
            {op.tradingName ?? op.legalName}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {op.destinationRegion}
            {op.country ? `, ${op.country}` : ""}
          </p>
        </div>
        {op.gpsTotal != null && (
          <div className="text-right">
            <span className="text-2xl font-black tabular-nums text-white">
              {op.gpsTotal}
            </span>
            <p className="text-[9px] text-white/30 uppercase tracking-wider">
              GPS
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Pillar bars */}
        <div className="space-y-2">
          {pillars.map((p) => (
            <div key={p.label} className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-mono font-semibold">
                  {p.value ?? "—"}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${p.value ?? 0}%`,
                    backgroundColor: p.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {bandConfig && (
            <Badge
              variant="secondary"
              className="text-[10px] rounded-full text-white"
              style={{ backgroundColor: `var(--color-${bandConfig.color.replace("bg-", "")})` }}
            >
              {bandConfig.label}
            </Badge>
          )}
          {typeConfig && (
            <Badge variant="outline" className="text-[10px] rounded-full">
              {typeConfig.label}
            </Badge>
          )}
        </div>

        {op.territory && (
          <p className="text-[10px] text-muted-foreground">
            📍 {op.territory.name}
            {op.territory.pressureLevel && (
              <span
                className={`ml-2 ${
                  op.territory.pressureLevel === "high"
                    ? "text-destructive"
                    : op.territory.pressureLevel === "moderate"
                      ? "text-[hsl(var(--trt-amber))]"
                      : "text-accent"
                }`}
              >
                · {op.territory.pressureLevel} DPI
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
