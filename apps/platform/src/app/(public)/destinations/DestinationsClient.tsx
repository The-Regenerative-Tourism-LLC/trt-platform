"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search, MapPin, TrendingUp, Leaf, Globe, Lock } from "lucide-react";

const DESTINATION_IMAGES: Record<string, string> = {
  "madeira": "/assets/dest-madeira.jpg",
  // "azores": "/assets/dest-azores.jpg",
  "misiones": "/assets/dest-misiones.jpg",
  "continental portugal": "/assets/dest-continental-portugal.jpg",
};

interface Territory {
  id: string;
  name: string;
  country: string | null;
  compositeDpi: number | null;
  pressureLevel: string | null;
  touristIntensity: number | null;
  ecologicalSensitivity: number | null;
  economicLeakageRate: number | null;
}

const LIVE_DESTINATIONS = ["madeira"];

export function DestinationsClient({
  territories,
}: {
  territories: Territory[];
}) {
  const [search, setSearch] = useState("");

  const filtered = territories.filter((t) => {
    const name = (t.name || "").toLowerCase();
    if (name === "unassigned" || !t.name) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return name.includes(q) || (t.country || "").toLowerCase().includes(q);
  });

  const isLive = (t: Territory) =>
    LIVE_DESTINATIONS.includes((t.name || "").toLowerCase());
  const launched = filtered.filter(isLive);
  const comingSoon = filtered.filter((t) => !isLive(t));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="/assets/destinations-hero-surf.jpg"
          alt="Destinations"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1C]/50 via-[#1C1C1C]/65 to-[#1C1C1C]/80" />
        <div className="relative z-10 container mx-auto max-w-7xl px-5 md:px-6 py-14 md:py-24 space-y-4">
          <p className="editorial-label text-white/50">Explore</p>
          <h1 className="text-2xl md:text-[3rem] font-bold tracking-tight leading-[1.05] max-w-2xl text-white">
            Destination pressure index
          </h1>
          <p className="text-sm text-white/50 max-w-lg leading-relaxed">
            Every destination has a measurable pressure score — combining tourist
            intensity, ecological sensitivity, economic leakage, and
            regenerative performance.
          </p>
        </div>
      </section>

      {/* Search bar */}
      <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto max-w-7xl py-3 md:py-4 flex items-center gap-4 px-5 md:px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 md:pl-11 border-border bg-card h-9 md:h-11 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl py-8 md:py-12 px-5 md:px-6 space-y-12">
        {filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 text-sm">
            No destinations found
          </div>
        ) : (
          <>
            {/* Launched */}
            {launched.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 bg-accent animate-pulse" />
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Live — Verified DPI
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {launched.map((t) => (
                    <LiveDestinationCard key={t.id} territory={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Coming soon */}
            {comingSoon.length > 0 && (
              <div>
                <div className="mb-2">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Coming soon
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mb-5 max-w-lg">
                  Each territory will receive a scientifically computed DPI based
                  on regional data from official statistics offices, conservation
                  agencies, and economic research.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {comingSoon.map((t) => (
                    <ComingSoonCard key={t.id} territory={t} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function LiveDestinationCard({ territory: t }: { territory: Territory }) {
  const metrics = [
    { label: "Tourist Intensity", value: t.touristIntensity, icon: TrendingUp },
    { label: "Ecology", value: t.ecologicalSensitivity, icon: Leaf },
    { label: "Leakage", value: t.economicLeakageRate, icon: Globe },
  ];

  const imgSrc = DESTINATION_IMAGES[(t.name || "").toLowerCase()];

  return (
    <div className="border border-border overflow-hidden rounded-xl card-interactive">
      <div className="relative aspect-[16/10] overflow-hidden">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={t.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(80,30%,28%)] to-[hsl(60,20%,32%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/70 via-[#1C1C1C]/20 to-transparent" />
        {t.compositeDpi != null && (
          <div className="absolute top-4 right-4 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded">
            <span className="text-white font-mono text-xs font-bold">
              DPI {t.compositeDpi}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
            {t.name}
          </h3>
          {t.country && (
            <p className="text-white/50 text-xs flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 shrink-0" /> {t.country}
            </p>
          )}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <m.icon className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground w-24 shrink-0">
                {m.label}
              </span>
              <div className="flex-1 h-1 bg-border overflow-hidden rounded-full">
                <div
                  className="h-full bg-accent transition-all duration-700 rounded-full"
                  style={{ width: `${m.value || 0}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-semibold w-6 text-right">
                {m.value ?? "—"}
              </span>
            </div>
          ))}
        </div>
        {t.pressureLevel && (
          <div className="flex items-center gap-2 pt-1">
            <span
              className={`text-[10px] font-medium px-2.5 py-0.5 rounded uppercase tracking-wider ${
                t.pressureLevel === "high"
                  ? "bg-destructive/10 text-destructive"
                  : t.pressureLevel === "moderate"
                    ? "bg-[hsl(var(--trt-amber))]/10 text-[hsl(var(--trt-amber))]"
                    : "bg-accent/10 text-accent"
              }`}
            >
              {t.pressureLevel} pressure
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ComingSoonCard({ territory: t }: { territory: Territory }) {
  const metrics = [
    { label: "Tourist Intensity", value: t.touristIntensity, icon: TrendingUp },
    { label: "Ecology", value: t.ecologicalSensitivity, icon: Leaf },
    { label: "Leakage", value: t.economicLeakageRate, icon: Globe },
  ];

  const imgSrc = DESTINATION_IMAGES[(t.name || "").toLowerCase()];

  return (
    <div className="border border-border overflow-hidden rounded-xl opacity-75 cursor-default">
      <div className="relative aspect-[16/10] overflow-hidden">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={t.name}
            fill
            className="object-cover grayscale"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(80,20%,28%)] to-[hsl(60,15%,32%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/70 via-[#1C1C1C]/30 to-[#1C1C1C]/10" />
        {t.compositeDpi != null && (
          <div className="absolute top-4 right-4 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded">
            <span className="text-white font-mono text-xs font-bold">
              DPI {t.compositeDpi}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
            {t.name}
          </h3>
          {t.country && (
            <p className="text-white/50 text-xs flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 shrink-0" /> {t.country}
            </p>
          )}
        </div>
        <div className="absolute top-4 left-4 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-white/40" />
          <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-white/40">
            Coming soon
          </span>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <m.icon className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground w-24 shrink-0">
                {m.label}
              </span>
              <div className="flex-1 h-1 bg-border overflow-hidden rounded-full">
                <div
                  className="h-full bg-foreground/20 transition-all duration-700 rounded-full"
                  style={{ width: `${m.value || 0}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-semibold w-6 text-right">
                {m.value ?? "—"}
              </span>
            </div>
          ))}
        </div>
        {t.pressureLevel && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded uppercase tracking-wider bg-secondary text-muted-foreground">
              {t.pressureLevel} pressure
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
