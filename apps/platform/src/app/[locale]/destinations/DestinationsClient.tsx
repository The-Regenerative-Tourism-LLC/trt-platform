"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Search, MapPin, TrendingUp, Leaf, Globe, Lock } from "lucide-react";

const DESTINATION_IMAGES: Record<string, string> = {
  "madeira": "/assets/dest-madeira.jpg",
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
  const t = useTranslations("public.destinations");
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
  const launched   = filtered.filter(isLive);
  const comingSoon = filtered.filter((t) => !isLive(t));

  return (
    <>
      {/* Hero — image overlay, opacity allowed */}
      <section className="relative overflow-hidden">
        <Image
          src="/assets/destinations-hero-surf.jpg"
          alt="Destinations"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/65 to-black/80" />
        <div className="relative z-10 container-section py-14 md:py-24 space-y-4">
          <p className="type-label text-pink">{t("eyebrow")}</p>
          <h1 className="type-h1 text-dark-foreground max-w-2xl">
            {t("title")}
          </h1>
          <p className="type-m text-pink max-w-lg">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Search bar — solid background */}
      <div className="sticky top-14 z-30 bg-background border-b border-border">
        <div className="container-section py-3 md:py-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 md:pl-11 border-border bg-card h-9 md:h-11 type-s"
            />
          </div>
        </div>
      </div>

      <div className="container-section py-8 md:py-12 space-y-12">
        {filtered.length === 0 ? (
          <div className="text-center text-black py-20 type-s">
            {t("empty")}
          </div>
        ) : (
          <>
            {launched.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 bg-accent animate-pulse" />
                  <p className="type-label text-black">
                    {t("liveLabel")}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {launched.map((t) => (
                    <LiveDestinationCard key={t.id} territory={t} />
                  ))}
                </div>
              </div>
            )}

            {comingSoon.length > 0 && (
              <div>
                <div className="mb-2">
                  <p className="type-label text-black">
                    {t("comingSoonLabel")}
                  </p>
                </div>
                <p className="type-xs text-black mb-5 max-w-lg">
                  {t("comingSoonBody")}
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
  const tDest = useTranslations("public.destinations");
  const metrics = [
    { label: tDest("metrics.touristIntensity"), value: t.touristIntensity, icon: TrendingUp },
    { label: tDest("metrics.ecology"),          value: t.ecologicalSensitivity, icon: Leaf },
    { label: tDest("metrics.leakage"),          value: t.economicLeakageRate, icon: Globe },
  ];

  const imgSrc = DESTINATION_IMAGES[(t.name || "").toLowerCase()];

  const pressureBadge = t.pressureLevel === "high"
    ? "badge-purple"
    : t.pressureLevel === "moderate"
      ? "badge-lime"
      : "badge-green";

  return (
    <div className="border border-border overflow-hidden card-interactive">
      <div className="relative aspect-[16/10] overflow-hidden">
        {imgSrc ? (
          <Image src={imgSrc} alt={t.name} fill className="object-cover transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 bg-dark" />
        )}
        {/* Image overlay — opacity allowed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {t.compositeDpi != null && (
          <div className="absolute top-4 right-4 bg-dark px-3 py-1.5">
            <span className="type-label text-dark-foreground tabular-nums">
              DPI {t.compositeDpi}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="type-h5 text-dark-foreground">{t.name}</h3>
          {t.country && (
            <p className="text-pink type-xs flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 shrink-0" /> {t.country}
            </p>
          )}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <m.icon className="w-3 h-3 text-black shrink-0" />
              <span className="type-xs text-black w-24 shrink-0">
                {m.label}
              </span>
              <div className="flex-1 h-1 bg-border overflow-hidden rounded-full">
                <div
                  className="h-full bg-accent transition-all duration-700 rounded-full"
                  style={{ width: `${m.value || 0}%` }}
                />
              </div>
              <span className="type-label tabular-nums w-6 text-right">
                {m.value ?? "—"}
              </span>
            </div>
          ))}
        </div>
        {t.pressureLevel && (
          <div className="flex items-center gap-2 pt-1">
            <span className={`badge ${pressureBadge}`}>
              {tDest(`pressure.${t.pressureLevel}` as any)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ComingSoonCard({ territory: t }: { territory: Territory }) {
  const tDest = useTranslations("public.destinations");
  const metrics = [
    { label: tDest("metrics.touristIntensity"), value: t.touristIntensity, icon: TrendingUp },
    { label: tDest("metrics.ecology"),          value: t.ecologicalSensitivity, icon: Leaf },
    { label: tDest("metrics.leakage"),          value: t.economicLeakageRate, icon: Globe },
  ];

  const imgSrc = DESTINATION_IMAGES[(t.name || "").toLowerCase()];

  return (
    <div className="border border-dashed border-border overflow-hidden cursor-default">
      <div className="relative aspect-[16/10] overflow-hidden">
        {imgSrc ? (
          <Image src={imgSrc} alt={t.name} fill className="object-cover grayscale" />
        ) : (
          <div className="absolute inset-0 bg-dark" />
        )}
        {/* Image overlay — opacity allowed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        {t.compositeDpi != null && (
          <div className="absolute top-4 right-4 bg-dark px-3 py-1.5">
            <span className="type-label text-dark-foreground tabular-nums">
              DPI {t.compositeDpi}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="type-h5 text-dark-foreground">{t.name}</h3>
          {t.country && (
            <p className="text-pink type-xs flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 shrink-0" /> {t.country}
            </p>
          )}
        </div>
        <div className="absolute top-4 left-4 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-pink" />
          <span className="type-label text-pink">
            {tDest("comingSoonPill")}
          </span>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <m.icon className="w-3 h-3 text-black shrink-0" />
              <span className="type-xs text-black w-24 shrink-0">
                {m.label}
              </span>
              <div className="flex-1 h-1 bg-border overflow-hidden rounded-full">
                <div
                  className="h-full bg-muted transition-all duration-700 rounded-full"
                  style={{ width: `${m.value || 0}%` }}
                />
              </div>
              <span className="type-label tabular-nums w-6 text-right text-black">
                {m.value ?? "—"}
              </span>
            </div>
          ))}
        </div>
        {t.pressureLevel && (
          <div className="flex items-center gap-2 pt-1">
            <span className="badge badge-pink">
              {tDest(`pressure.${t.pressureLevel}` as any)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
