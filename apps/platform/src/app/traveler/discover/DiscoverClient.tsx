"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Leaf,
  Building2,
  Compass,
  Star,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { GPSCircle, GPSBandBadge, DPSBandBadge } from "@/components/scoring/ScoreDisplays";
import { GPS_BAND_CONFIG, DPS_BAND_CONFIG } from "@/lib/constants";
import type { GreenPassportBand, DpsBand } from "@/lib/engine/trt-scoring-engine/types";

interface OperatorCard {
  id: string;
  legalName: string;
  tradingName: string | null;
  destinationRegion: string | null;
  country: string | null;
  coverPhotoUrl: string | null;
  territory: {
    id: string;
    name: string;
    pressureLevel: string | null;
    compositeDpi: number | null;
  } | null;
  activities: {
    id: string;
    title: string;
    type: string;
    difficulty: string | null;
  }[];
  score: {
    gpsTotal: number;
    gpsBand: string;
    dpsTotal: number | null;
    dpsBand: string | null;
    computedAt: string;
  } | null;
}

interface Territory {
  id: string;
  name: string;
}

interface Props {
  operators: OperatorCard[];
  territories: Territory[];
}

const BAND_OPTIONS = [
  { value: "", label: "All bands" },
  { value: "regenerative_leader", label: "Regenerative Leader" },
  { value: "regenerative_practice", label: "Regenerative Practice" },
  { value: "advancing", label: "Advancing" },
  { value: "developing", label: "Developing" },
];

function bandBgClass(band: string): string {
  const map: Record<string, string> = {
    regenerative_leader: "bg-emerald-600",
    regenerative_practice: "bg-green-600",
    advancing: "bg-teal-600",
    developing: "bg-amber-600",
    not_yet_published: "bg-zinc-400",
  };
  return map[band] ?? "bg-zinc-400";
}

function pressureColor(level: string | null): string {
  if (level === "high") return "text-red-600";
  if (level === "moderate") return "text-amber-600";
  return "text-emerald-600";
}

export function DiscoverClient({ operators, territories }: Props) {
  const [search, setSearch] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "recent" | "name">("score");
  const [showFilters, setShowFilters] = useState(false);

  const accommodations = useMemo(() => {
    return operators.filter((op) => op.activities.length === 0 || op.score);
  }, [operators]);

  const withExperiences = useMemo(() => {
    return operators.filter((op) => op.activities.length > 0);
  }, [operators]);

  function filterAndSort(items: OperatorCard[]) {
    let filtered = items;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (op) =>
          (op.tradingName?.toLowerCase().includes(q) ?? false) ||
          op.legalName.toLowerCase().includes(q) ||
          (op.destinationRegion?.toLowerCase().includes(q) ?? false)
      );
    }

    if (bandFilter) {
      filtered = filtered.filter((op) => op.score?.gpsBand === bandFilter);
    }

    if (territoryFilter) {
      filtered = filtered.filter((op) => op.territory?.id === territoryFilter);
    }

    const sorted = [...filtered];
    if (sortBy === "score") {
      sorted.sort((a, b) => (b.score?.gpsTotal ?? 0) - (a.score?.gpsTotal ?? 0));
    } else if (sortBy === "name") {
      sorted.sort((a, b) =>
        (a.tradingName ?? a.legalName).localeCompare(b.tradingName ?? b.legalName)
      );
    }

    return sorted;
  }

  const filteredAll = filterAndSort(operators);
  const filteredAccom = filterAndSort(accommodations);
  const filteredExperiences = filterAndSort(withExperiences);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-emerald-600" />
          <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        </div>
        <p className="text-muted-foreground">
          Explore verified regenerative operators. Every score is computed, not claimed.
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search operators, destinations..."
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Filters
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="py-4 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground">GPS Band</label>
              <select
                value={bandFilter}
                onChange={(e) => setBandFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {BAND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground">Territory</label>
              <select
                value={territoryFilter}
                onChange={(e) => setTerritoryFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All territories</option>
                {territories.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs font-medium text-muted-foreground">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "score" | "recent" | "name")}
                className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="score">Highest Score</option>
                <option value="recent">Most Recent</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
            {(bandFilter || territoryFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBandFilter("");
                  setTerritoryFilter("");
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
              {filteredAll.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stay">
            <Building2 className="h-3.5 w-3.5 mr-1" />
            Stay
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
              {filteredAccom.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="experiences">
            <Compass className="h-3.5 w-3.5 mr-1" />
            Experiences
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
              {filteredExperiences.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <OperatorGrid operators={filteredAll} />
        </TabsContent>
        <TabsContent value="stay">
          <OperatorGrid operators={filteredAccom} />
        </TabsContent>
        <TabsContent value="experiences">
          <OperatorGrid operators={filteredExperiences} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OperatorGrid({ operators }: { operators: OperatorCard[] }) {
  if (operators.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <Search className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-lg font-semibold">No operators found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {operators.map((op) => (
        <OperatorCardComponent key={op.id} operator={op} />
      ))}
    </div>
  );
}

function OperatorCardComponent({ operator: op }: { operator: OperatorCard }) {
  const score = op.score;
  if (!score) return null;

  const gpsBand = score.gpsBand as GreenPassportBand;
  const config = GPS_BAND_CONFIG[gpsBand];
  const dpsBand = score.dpsBand ? (score.dpsBand as DpsBand) : null;
  const dpsConfig = dpsBand ? DPS_BAND_CONFIG[dpsBand] : null;

  return (
    <Link
      href={`/operators/${op.id}`}
      className="group rounded-2xl border bg-card hover:shadow-lg transition-all overflow-hidden flex flex-col"
    >
      {/* Cover */}
      <div className="relative">
        {op.coverPhotoUrl ? (
          <div
            className="h-44 w-full bg-cover bg-center group-hover:scale-[1.02] transition-transform duration-500"
            style={{ backgroundImage: `url(${op.coverPhotoUrl})` }}
          />
        ) : (
          <div className="h-44 w-full bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 flex items-center justify-center">
            <Leaf className="h-10 w-10 text-emerald-300" />
          </div>
        )}

        {/* GPS overlay */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
          <div className="text-center">
            <span className="text-2xl font-black tabular-nums leading-none">
              {score.gpsTotal}
            </span>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
              GPS
            </p>
          </div>
        </div>

        {/* Band badge overlay */}
        <div className="absolute bottom-3 left-3">
          <span
            className={`text-xs text-white font-semibold px-2.5 py-1 rounded-full ${bandBgClass(gpsBand)} shadow-sm`}
          >
            {config.label}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Name + location */}
        <div>
          <p className="font-semibold leading-tight group-hover:text-emerald-700 transition-colors">
            {op.tradingName ?? op.legalName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {op.destinationRegion}
            {op.country ? `, ${op.country}` : ""}
          </p>
        </div>

        {/* Mini pillar bars */}
        <div className="space-y-1 mt-auto">
          {[
            { label: "P1 Footprint", color: "bg-emerald-500" },
            { label: "P2 Integration", color: "bg-amber-500" },
            { label: "P3 Contribution", color: "bg-teal-500" },
          ].map((p, i) => {
            const value = i === 0 ? 0 : 0; // Pillar scores not in the card data
            return null; // Only show if we have pillar data
          })}
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {dpsConfig && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-muted-foreground">
              {dpsConfig.arrow} {dpsConfig.label}
            </span>
          )}
          {op.activities.length > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {op.activities.length} experience{op.activities.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Territory + DPI */}
        {op.territory && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {op.territory.name}
            {op.territory.pressureLevel && (
              <span className={`ml-1 font-medium ${pressureColor(op.territory.pressureLevel)}`}>
                · {op.territory.pressureLevel} pressure
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
