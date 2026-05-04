"use client";

import { useState, useEffect } from "react";
import type { ReactNode, ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { Building2, Mountain, Sparkles, Info, HelpCircle, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import { StepShell } from "../shell";
import { uploadPhotoBatch, fetchCurrentPhotos } from "@/lib/photos/upload-batch";
import {
  FieldGroup,
  NumberInput,
  TogglePair,
  Tip,
  inputCls,
} from "../primitives";

const MapboxAddressPicker = dynamic(
  () =>
    import("../MapboxAddressPicker").then((m) => ({
      default: m.MapboxAddressPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
    ),
  }
);

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  floatingGps?: ReactNode;
}

// ── Operator Type ─────────────────────────────────────────────────────────────

const operatorIconMap = {
  A: Building2,
  B: Mountain,
  C: Sparkles,
} as const;

export function OperatorTypeStep({
  data,
  updateField,
  shell,
}: StepProps) {
  const t = useTranslations("onboarding.profile.operatorType");

  const typeOptions = [
    {
      key: "A" as const,
      label: t("accommodationLabel"),
      desc: t("accommodationDesc"),
      badge: "guest-nights",
    },
    {
      key: "B" as const,
      label: t("experienceLabel"),
      desc: t("experienceDesc"),
      badge: "visitor-days",
    },
    {
      key: "C" as const,
      label: t("combinedLabel"),
      desc: t("combinedDesc"),
      badge: "guest-nights",
    },
  ];

  const showAccomGate =
    data.operatorType === "B" &&
    data._accomGateShown === true &&
    !data._confirmsNoAccommodation;

  const confirmedNoAccom =
    data.operatorType === "B" &&
    data._confirmsNoAccommodation === true;

  const topIcon = (
    <div className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center">
      <Building2 className="w-5 h-5 text-foreground/50" strokeWidth={1.5} />
    </div>
  );

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
      topIcon={topIcon}
      isFirst
    >
      {/* Option cards */}
      <div className="space-y-2">
        {typeOptions.map((opt) => {
          const isSelected = data.operatorType === opt.key;
          const Icon = operatorIconMap[opt.key];
          return (
            <button
              key={opt.key}
              onClick={() => {
                updateField({
                  operatorType: opt.key,
                  _accomGateShown: false,
                  _confirmsNoAccommodation: false,
                  _accomGateWarn: false,
                });
              }}
              className={[
                "w-full flex items-center gap-4 rounded-2xl border px-4 py-5 text-left transition-all",
                isSelected
                  ? "border-foreground bg-card"
                  : "border-border/40 bg-card hover:border-border/60",
              ].join(" ")}
            >
              {/* Left icon tile */}
              <div className={[
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                isSelected ? "bg-foreground" : "bg-muted/60",
              ].join(" ")}>
                <Icon
                  className={isSelected ? "w-5 h-5 text-background" : "w-5 h-5 text-foreground/50"}
                  strokeWidth={1.5}
                />
              </div>

              {/* Text column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-foreground leading-snug">
                    {opt.label}
                  </span>
                  <span className="text-[10px] font-medium text-black border border-border/60 rounded-full px-2 py-0.5 leading-none whitespace-nowrap">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-sm text-black mt-1.5 leading-relaxed">
                  {opt.desc}
                </p>
              </div>

              {/* Radio indicator */}
              {isSelected ? (
                <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-background" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-border/60 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Type B accommodation gate */}
      {showAccomGate && (
        <div className="rounded-xl border-2 border-primary/40 bg-secondary/50 p-5 space-y-4">
          <p className="text-sm font-medium">
            {t("accomGateQuestion")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() =>
                updateField({ _accomGateWarn: true })
              }
              className="rounded-xl px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              {t("accomGateYes")}
            </button>
            <button
              onClick={() =>
                updateField({
                  _confirmsNoAccommodation: true,
                  _accomGateWarn: false,
                })
              }
              className="rounded-xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("accomGateNo")}
            </button>
          </div>
          {data._accomGateWarn && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 space-y-3">
              <p className="text-sm text-destructive">
                {t("accomGateWarn")}
              </p>
              <button
                onClick={() =>
                  updateField({
                    operatorType: "C",
                    _accomGateShown: false,
                    _accomGateWarn: false,
                  })
                }
                className="rounded-xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t("accomGateSelectC")}
              </button>
            </div>
          )}
        </div>
      )}

      {confirmedNoAccom && (
        <div className="rounded-xl bg-secondary border border-primary/30 p-3 flex items-center gap-2">
          <span className="text-primary">✓</span>
          <span className="text-sm text-primary">
            {t("confirmedNoAccom")}
          </span>
        </div>
      )}

      {/* Info box */}
      <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-surface/20 px-4 py-4">
        <Info className="w-[15px] h-[15px] shrink-0 text-black/70 mt-px" strokeWidth={1.5} />
        <p className="text-sm text-black leading-relaxed">
          {t("infoBox")}
        </p>
      </div>
    </StepShell>
  );
}

// ── Identity ──────────────────────────────────────────────────────────────────

export function IdentityStep({
  data,
  updateField,
  shell,
  floatingGps,
  territories,
}: StepProps & {
  territories: Array<{ id: string; name: string; country: string | null; compositeDpi?: number | null }>;
}) {
  const t = useTranslations("onboarding.profile.identity");

  const topIcon = (
    <div className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center">
      <Building2 className="w-5 h-5 text-foreground/50" strokeWidth={1.5} />
    </div>
  );

  // Auto-deduce territory from destination region or country.
  // Priority: match territory name against destinationRegion first, then country.
  // If no match is found, fall back to Madeira as the reference territory.
  // If the matched territory has no DPI, mark referenceDpi = true so scoring
  // uses Madeira's DPI and the UI shows the appropriate warning.
  useEffect(() => {
    if (!territories.length) return;
    const region = (data.destinationRegion ?? "").toLowerCase().trim();
    const country = (data.country ?? "").toLowerCase().trim();
    if (!region && !country) return;

    const match =
      territories.find((terr) => region && terr.name.toLowerCase() === region) ??
      territories.find((terr) => country && terr.country?.toLowerCase() === country);

    const madeira = territories.find((terr) => terr.name.toLowerCase() === "madeira");

    if (match) {
      const hasDpi = match.compositeDpi != null;
      const newReferenceDpi = !hasDpi;
      if (match.id !== data.territoryId || newReferenceDpi !== data.referenceDpi) {
        updateField({ territoryId: match.id, referenceDpi: newReferenceDpi });
      }
    } else if (madeira) {
      // No territory match — use Madeira as fallback territory
      if (madeira.id !== data.territoryId || data.referenceDpi !== true) {
        updateField({ territoryId: madeira.id, referenceDpi: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.destinationRegion, data.country, territories]);

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
      topIcon={topIcon}
    >
      {floatingGps}

      {/* Business identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label={t("legalName")}>
          <input
            type="text"
            value={data.legalName ?? ""}
            onChange={(e) => updateField({ legalName: e.target.value })}
            className={inputCls}
            placeholder={t("legalNamePlaceholder")}
          />
        </FieldGroup>
        <FieldGroup label={t("tradingName")}>
          <input
            type="text"
            value={data.tradingName ?? ""}
            onChange={(e) => updateField({ tradingName: e.target.value })}
            className={inputCls}
            placeholder={t("tradingNamePlaceholder")}
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label={t("website")}>
          <input
            type="url"
            value={data.website ?? ""}
            onChange={(e) => updateField({ website: e.target.value })}
            className={inputCls}
            placeholder={t("websitePlaceholder")}
          />
        </FieldGroup>
        <FieldGroup label={t("yearStarted")}>
          <NumberInput
            value={data.yearOperationStart}
            onChange={(v) => updateField({ yearOperationStart: v })}
            placeholder={t("yearStartedPlaceholder")}
            min={1900}
            max={new Date().getFullYear()}
          />
        </FieldGroup>
      </div>

      {/* Location section */}
      <div className="border-t border-border/50 pt-6 space-y-4">
        <p className="text-sm font-semibold">{t("locationSection")}</p>

        <FieldGroup
          label={data.operatorType === "B" ? t("meetingPoint") : t("fullAddress")}
        >
          <MapboxAddressPicker
            initialAddress={data.address}
            initialLat={data.latitude}
            initialLng={data.longitude}
            onSelect={(loc) =>
              updateField({
                address: loc.address,
                latitude: loc.latitude,
                longitude: loc.longitude,
                country: loc.country ?? data.country,
                destinationRegion: loc.region ?? data.destinationRegion,
              })
            }
            onAddressTyped={(val) => updateField({ address: val })}
          />
        </FieldGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label={t("destinationRegion")}>
            <input
              type="text"
              value={data.destinationRegion ?? ""}
              onChange={(e) => updateField({ destinationRegion: e.target.value })}
              className={inputCls}
              placeholder={t("destinationRegionPlaceholder")}
            />
          </FieldGroup>
          <FieldGroup label={t("country")}>
            <input
              type="text"
              value={data.country ?? ""}
              onChange={(e) => updateField({ country: e.target.value })}
              className={inputCls}
              placeholder={t("countryPlaceholder")}
            />
          </FieldGroup>
        </div>

        {data.referenceDpi === true && (data.destinationRegion || data.country) && (
          <div className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm  leading-relaxed">
              {t("noDpiWarning")}
            </p>
          </div>
        )}

      </div>

      {/* Ownership */}
      <OwnershipSection data={data} updateField={updateField} />
    </StepShell>
  );
}

// ── Ownership section (shared UI block) ───────────────────────────────────────

const OWNERSHIP_TYPES = [
  { value: "sole-proprietor", labelKey: "soleProprietor" },
  { value: "local-company",   labelKey: "localCompany" },
  { value: "partnership",     labelKey: "partnership" },
  { value: "private-company", labelKey: "privateCompany" },
  { value: "public-company",  labelKey: "publicCompany" },
] as const;

// Variant A: locally-rooted types — show livesLocally + solo owner question
const VARIANT_A = new Set(["sole-proprietor", "local-company"]);
// Variant B: corporate types — show equity % slider
const VARIANT_B = new Set(["partnership", "private-company", "public-company"]);

function OwnershipSection({
  data,
  updateField,
}: {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
}) {
  const t = useTranslations("onboarding.profile.ownership");
  const ownershipType = data.ownershipType ?? "";
  const isVariantA    = VARIANT_A.has(ownershipType);
  const isVariantB    = VARIANT_B.has(ownershipType);
  const isChain       = data.isChainMember === true;

  return (
    <div className="border-t border-border/50 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <span className="text-black mt-0.5">🔒</span>
        <div>
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="text-xs text-black mt-0.5">
            {t("confidential")}
          </p>
        </div>
      </div>

      {/* 1. Ownership type */}
      <FieldGroup label={t("ownershipType")}>
        <select
          value={ownershipType}
          onChange={(e) => {
            const next = e.target.value;
            updateField({
              ownershipType: next || undefined,
              // clear variant-specific fields when switching
              ownerLivesLocally: VARIANT_A.has(next) ? data.ownerLivesLocally : undefined,
              soloOperator: VARIANT_A.has(next) ? data.soloOperator : undefined,
              localEquityPct: VARIANT_B.has(next) ? data.localEquityPct : undefined,
            });
          }}
          className={inputCls}
        >
          <option value="">{t("selectPlaceholder")}</option>
          {OWNERSHIP_TYPES.map((ot) => (
            <option key={ot.value} value={ot.value}>{t(ot.labelKey)}</option>
          ))}
        </select>
      </FieldGroup>

      {/* Variant A — sole proprietor / local company */}
      {isVariantA && (
        <>
          {/* 2A. Do you live within the destination region? */}
          <FieldGroup label={t("livesLocally")}>
            <TogglePair
              value={data.ownerLivesLocally}
              trueLabel={t("livesLocallyYes")}
              falseLabel={t("livesLocallyNo")}
              onChange={(v) => updateField({ ownerLivesLocally: v })}
            />
          </FieldGroup>

          {/* 3A. Chain toggle */}
          <ChainToggle isChain={isChain} label={t("chainToggle")} onToggle={() =>
            updateField({ isChainMember: !isChain, chainName: isChain ? undefined : data.chainName })
          } />
          {isChain && (
            <FieldGroup label={t("chainName")}>
              <input
                type="text"
                value={data.chainName ?? ""}
                onChange={(e) => updateField({ chainName: e.target.value })}
                className={inputCls}
                placeholder={t("chainNamePlaceholder")}
              />
            </FieldGroup>
          )}

        </>
      )}

      {/* Variant B — partnership / private / public company */}
      {isVariantB && (
        <>
          {/* 2B. Local equity % slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {t("localEquity")}
              </label>
              <span className="text-sm font-mono font-semibold tabular-nums">
                {data.localEquityPct ?? 0}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={data.localEquityPct ?? 0}
              onChange={(e) => updateField({ localEquityPct: Number(e.target.value) })}
              className="w-full accent-foreground cursor-pointer"
            />
            <div className="flex justify-between text-xs text-black">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 3B. Chain toggle */}
          <ChainToggle isChain={isChain} label={t("chainToggle")} onToggle={() =>
            updateField({ isChainMember: !isChain, chainName: isChain ? undefined : data.chainName })
          } />
          {isChain && (
            <FieldGroup label={t("chainName")}>
              <input
                type="text"
                value={data.chainName ?? ""}
                onChange={(e) => updateField({ chainName: e.target.value })}
                className={inputCls}
                placeholder={t("chainNamePlaceholder")}
              />
            </FieldGroup>
          )}
        </>
      )}
    </div>
  );
}

function ChainToggle({ isChain, label, onToggle }: { isChain: boolean; label: string; onToggle: () => void }) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card cursor-pointer select-none"
      onClick={onToggle}
    >
      <div
        className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          isChain ? "bg-foreground" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isChain ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// ── Accommodation ─────────────────────────────────────────────────────────────

const ACCOM_CATEGORY_KEYS = [
  { id: "hotel", labelKey: "hotel" },
  { id: "guesthouse", labelKey: "guesthouse" },
  { id: "hostel", labelKey: "hostel" },
  { id: "eco-lodge", labelKey: "lodge" },
  { id: "surf-lodge", labelKey: "surfLodge" },
  { id: "glamping", labelKey: "glamping" },
  { id: "farm-stay", labelKey: "farmStay" },
] as const;

export function AccommodationStep({
  data,
  updateField,
  shell,
}: StepProps) {
  const t = useTranslations("onboarding.profile.accommodation");
  const tTypes = useTranslations("onboarding.profile.operatorType");
  const selectedCat = data.accommodationCategory ?? "";

  const accomCategories = [
    { id: "hotel", label: tTypes("hotel") },
    { id: "guesthouse", label: "Guesthouse / B&B" },
    { id: "hostel", label: "Hostel" },
    { id: "eco-lodge", label: "Eco-lodge" },
    { id: "surf-lodge", label: "Surf Lodge" },
    { id: "glamping", label: tTypes("glamping") },
    { id: "farm-stay", label: "Farm stay" },
  ];

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      <FieldGroup label={t("propertyType")} hint={t("propertyTypeHint")}>
        <div className="flex flex-wrap gap-2">
          {accomCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateField({ accommodationCategory: cat.id })}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                selectedCat === cat.id
                  ? "border-foreground bg-secondary text-foreground"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label={t("rooms")} hint={t("roomsHint")}>
          <NumberInput
            value={data.rooms}
            onChange={(v) => updateField({ rooms: v })}
            placeholder="e.g. 12"
            min={1}
          />
        </FieldGroup>
        <FieldGroup label={t("bedCapacity")} hint={t("bedCapacityHint")}>
          <NumberInput
            value={data.bedCapacity}
            onChange={(v) => updateField({ bedCapacity: v })}
            placeholder="e.g. 24"
            min={1}
          />
        </FieldGroup>
      </div>

      <FieldGroup
        label={t("foodService")}
        hint={t("foodServiceHint")}
      >
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "full_restaurant", labelKey: "fullRestaurant" },
            { id: "breakfast_only", labelKey: "breakfastOnly" },
            { id: "snacks_bar", labelKey: "snacksBar" },
            { id: "no_food", labelKey: "noFood" },
          ] as const).map((fs) => (
            <button
              key={fs.id}
              onClick={() => updateField({ foodServiceType: fs.id })}
              className={`rounded-xl border-2 p-3 text-sm text-center transition-all ${
                data.foodServiceType === fs.id
                  ? "border-foreground bg-secondary font-medium text-foreground"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {t(fs.labelKey)}
            </button>
          ))}
        </div>
      </FieldGroup>
    </StepShell>
  );
}

// ── Experience Types ──────────────────────────────────────────────────────────

const EXPERIENCE_SUBCATEGORIES = [
  { id: "nature_wildlife", label: "Nature & Wildlife", desc: "Guided nature walks, wildlife spotting", icon: "🌿" },
  { id: "whale_watching", label: "Whale & Dolphin Watching", desc: "Marine mammal observation trips", icon: "🐋" },
  { id: "diving_snorkelling", label: "Diving & Snorkelling", desc: "Underwater exploration and courses", icon: "🤿" },
  { id: "hiking_trekking", label: "Hiking & Trekking", desc: "Mountain trails and multi-day routes", icon: "🥾" },
  { id: "kayaking_watersports", label: "Kayaking & Water Sports", desc: "Paddleboarding, surfing, sailing", icon: "🚣" },
  { id: "cycling", label: "Cycling & E-bike", desc: "Road, gravel, and mountain bike tours", icon: "🚴" },
  { id: "cultural_heritage", label: "Cultural & Heritage", desc: "History, architecture, tradition tours", icon: "🏛️" },
  { id: "photography", label: "Photography Tours", desc: "Landscape and wildlife photo expeditions", icon: "📸" },
  { id: "birdwatching", label: "Birdwatching", desc: "Guided ornithological experiences", icon: "🦅" },
  { id: "wellness_yoga", label: "Wellness & Yoga", desc: "Retreats, meditation, spa", icon: "🧘" },
  { id: "volunteering", label: "Volunteering", desc: "Conservation, community, education", icon: "🤝" },
  { id: "food_agritourism", label: "Food & Agritourism", desc: "Cooking classes, farm visits, gastronomy", icon: "🍷" },
];

export function ExperienceTypesStep({
  data,
  updateField,
  shell,
}: StepProps) {
  const t = useTranslations("onboarding.profile.experience");
  const selected = data.experienceTypes ?? [];
  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {EXPERIENCE_SUBCATEGORIES.map((sub) => {
          const isSelected = selected.includes(sub.id);
          return (
            <button
              key={sub.id}
              onClick={() =>
                updateField({
                  experienceTypes: isSelected
                    ? selected.filter((s) => s !== sub.id)
                    : [...selected, sub.id],
                })
              }
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                isSelected
                  ? "border-foreground bg-secondary shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/20"
              }`}
            >
              <span className="text-xl block mb-1">{sub.icon}</span>
              <p className="text-xs font-semibold leading-tight">{sub.label}</p>
              <p className="text-[10px] text-black mt-0.5 leading-snug">
                {sub.desc}
              </p>
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-black">
          {t("selectAtLeastOne")}
        </p>
      )}
    </StepShell>
  );
}

// ── Ownership ─────────────────────────────────────────────────────────────────

export function OwnershipStep({
  data,
  updateField,
  shell,
}: StepProps) {
  const t = useTranslations("onboarding.profile.ownership");
  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      <FieldGroup
        label={t("ownershipType")}
        hint={t("howStructured")}
      >
        <select
          value={data.ownershipType ?? ""}
          onChange={(e) => updateField({ ownershipType: e.target.value || undefined })}
          className={inputCls}
        >
          <option value="">{t("selectPlaceholder")}</option>
          <option value="sole-proprietor">{t("soleProprietor")}</option>
          <option value="partnership">{t("partnership")}</option>
          <option value="family-business">Family business</option>
          <option value="community-owned">Community-owned</option>
          <option value="cooperative">Cooperative</option>
          <option value="ngo">NGO / Non-profit</option>
          <option value="private-limited">Private limited company</option>
          <option value="other">Other</option>
        </select>
      </FieldGroup>
      <FieldGroup
        label={t("localEquity")}
        hint={t("localEquityHint")}
      >
        <NumberInput
          value={data.localEquityPct}
          onChange={(v) => updateField({ localEquityPct: v })}
          placeholder="e.g. 100"
          min={0}
          max={100}
        />
      </FieldGroup>
      <FieldGroup label={t("partOfChain")}>
        <TogglePair
          value={data.isChainMember === true ? true : data.isChainMember === false ? false : undefined}
          trueLabel={t("chainMember")}
          falseLabel={t("independent")}
          onChange={(v) => updateField({ isChainMember: v, chainName: v ? data.chainName : undefined })}
        />
      </FieldGroup>
      {data.isChainMember && (
        <FieldGroup label={t("chainName")}>
          <input
            type="text"
            value={data.chainName ?? ""}
            onChange={(e) => updateField({ chainName: e.target.value })}
            className={inputCls}
            placeholder={t("chainNamePlaceholder")}
          />
        </FieldGroup>
      )}
      <FieldGroup
        label={t("soloQuestion")}
        hint={t("soloHint")}
      >
        <TogglePair
          value={data.soloOperator}
          trueLabel={t("soloYes")}
          falseLabel={t("soloNo")}
          onChange={(v) => updateField({ soloOperator: v })}
        />
      </FieldGroup>
    </StepShell>
  );
}

// ── Activity Unit ─────────────────────────────────────────────────────────────

export function ActivityUnitStep({
  data,
  updateField,
  shell,
}: StepProps) {
  const t = useTranslations("onboarding.profile.activity");
  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {data.operatorType !== "B" && (
        <FieldGroup
          label={t("guestNights")}
          hint={t("guestNightsHint")}
        >
          <NumberInput
            value={data.guestNights}
            onChange={(v) => updateField({ guestNights: v })}
            placeholder={t("guestNightsPlaceholder")}
            min={0}
          />
        </FieldGroup>
      )}
      {data.operatorType !== "A" && (
        <FieldGroup
          label={t("visitorDays")}
          hint={t("visitorDaysHint")}
        >
          <NumberInput
            value={data.visitorDays}
            onChange={(v) => updateField({ visitorDays: v })}
            placeholder={t("visitorDaysPlaceholder")}
            min={0}
          />
        </FieldGroup>
      )}
      {data.operatorType === "C" && (
        <>
          <FieldGroup
            label={t("revenueSplitAccom")}
            hint={t("revenueSplitAccomHint")}
          >
            <NumberInput
              value={data.revenueSplitAccommodationPct}
              onChange={(v) => updateField({ revenueSplitAccommodationPct: v })}
              placeholder="e.g. 60"
              min={0}
              max={100}
            />
          </FieldGroup>
          <FieldGroup label={t("revenueSplitExp")}>
            <NumberInput
              value={data.revenueSplitExperiencePct}
              onChange={(v) => updateField({ revenueSplitExperiencePct: v })}
              placeholder="e.g. 40"
              min={0}
              max={100}
            />
          </FieldGroup>
          {data.revenueSplitAccommodationPct != null &&
            data.revenueSplitExperiencePct != null &&
            Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct) !== 100 && (
              <p className="text-sm text-amber-600">
                {t("revenueSplitError", { current: Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct) })}
              </p>
            )}
        </>
      )}
    </StepShell>
  );
}

// ── Operation & Activity (merged) ─────────────────────────────────────────────

const ACCOM_CATEGORIES_MERGED = [
  { id: "hotel", label: "Hotel" },
  { id: "guesthouse", label: "Guesthouse / B&B" },
  { id: "hostel", label: "Hostel" },
  { id: "eco-lodge", label: "Eco-lodge" },
  { id: "surf-lodge", label: "Surf Lodge" },
  { id: "glamping", label: "Glamping" },
  { id: "farm-stay", label: "Farm stay" },
];

const EXPERIENCE_SUBCATEGORIES_MERGED = [
  { id: "nature_wildlife",      label: "Nature & Wildlife",                    desc: "Nature walks, wildlife photography, guided nature experiences",          icon: "🌿" },
  { id: "whale_watching",       label: "Whale & Dolphin Watching",             desc: "Cetacean observation tours, marine wildlife excursions",                 icon: "🐋" },
  { id: "diving_snorkelling",   label: "Snorkelling & Diving",                 desc: "Reef diving, snorkelling tours, underwater exploration",                 icon: "🤿" },
  { id: "birdwatching",         label: "Birdwatching & Wildlife Observation",  desc: "Guided birdwatching, wildlife hides, species identification walks",      icon: "🦅" },
  { id: "kayaking_watersports", label: "Water-based Activities",               desc: "Kayaking, surfing, sailing, canyoning, stand-up paddleboarding",        icon: "🚣" },
  { id: "cultural_heritage",    label: "Cultural & Heritage",                  desc: "Historical tours, museum visits, heritage experiences",                  icon: "🏛️" },
  { id: "cooking_food",         label: "Cooking Classes & Food Experiences",   desc: "Traditional cooking workshops, food tours, gastronomy experiences",      icon: "🍳" },
  { id: "art_craft",            label: "Art & Craft Workshops",                desc: "Embroidery, pottery, painting, woodworking, traditional crafts",         icon: "🎨" },
  { id: "adventure_sport",      label: "Adventure & Sport",                    desc: "Hiking, climbing, MTB, trail running, paragliding",                     icon: "⛰️" },
  { id: "wellness_creative",    label: "Wellness & Creative",                  desc: "Yoga retreats, art workshops, photography tours, meditation",            icon: "🧘" },
  { id: "food_agritourism",     label: "Food & Agritourism",                   desc: "Farm visits, wine tours, food trails, foraging, harvest experiences",    icon: "🌾" },
];

const FOOD_SERVICE_OPTIONS = [
  {
    id: "full_restaurant" as const,
    labelKey: "fullRestaurantLabel" as const,
    descKey: "fullRestaurantDesc" as const,
  },
  {
    id: "breakfast_only" as const,
    labelKey: "breakfastOnlyLabel" as const,
    descKey: "breakfastOnlyDesc" as const,
  },
  {
    id: "snacks_bar" as const,
    labelKey: "snacksBarLabel" as const,
    descKey: "snacksBarDesc" as const,
  },
  {
    id: "no_food" as const,
    labelKey: "noFoodLabel" as const,
    descKey: "noFoodDesc" as const,
  },
];

function FoodServiceSection({
  data,
  updateField,
}: {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
}) {
  const t = useTranslations("onboarding.profile.operationActivity");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold">{t("foodOnSite")}</p>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button type="button" className="text-black/60 hover:text-black transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-background text-foreground border border-border shadow-md max-w-[280px] text-sm leading-relaxed py-3 px-4"
          >
            {t("foodOnSiteTooltip")}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FOOD_SERVICE_OPTIONS.map((fs) => (
          <button
            key={fs.id}
            onClick={() => updateField({ foodServiceType: fs.id })}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              data.foodServiceType === fs.id
                ? "border-foreground bg-secondary"
                : "border-border hover:border-foreground/30 bg-background"
            }`}
          >
            <p className="text-base font-semibold">{t(fs.labelKey)}</p>
            <p className="text-sm text-black mt-0.5 leading-relaxed">{t(fs.descKey)}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/50 px-4 py-3">
        <span className="text-base shrink-0 mt-0.5">🌿</span>
        <p className="text-sm text-black leading-relaxed">
          <span className="font-semibold text-foreground">{t("foodAgriTip")}</span>{" "}
          {t("foodAgriTipBody")}
        </p>
      </div>
    </div>
  );
}

export function OperationActivityStep({ data, updateField, shell }: StepProps) {
  const t = useTranslations("onboarding.profile.operationActivity");
  const selectedExp = data.experienceTypes ?? [];
  const showAccom = data.operatorType === "A" || data.operatorType === "C";
  const showExp   = data.operatorType === "B" || data.operatorType === "C";
  const showSplit  = data.operatorType === "C";
  const isPureExp = data.operatorType === "B";

  const topIcon = isPureExp ? (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <Mountain className="w-6 h-6 text-black" />
    </div>
  ) : (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <Building2 className="w-6 h-6 text-black" />
    </div>
  );

  return (
    <StepShell
      {...shell}
      title={isPureExp ? t("stepTitleExp") : t("stepTitleAccom")}
      subtitle={t("stepSubtitle")}
      topIcon={topIcon}
    >
      {/* ── Accommodation details (A/C) */}
      {showAccom && (
        <>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">{t("accomCategories")}</p>
              <p className="text-xs text-black mt-0.5">{t("accomCategoriesHint")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCOM_CATEGORIES_MERGED.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateField({ accommodationCategory: cat.id })}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    data.accommodationCategory === cat.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/40 bg-background"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label={t("roomsLabel")}>
              <NumberInput value={data.rooms} onChange={(v) => updateField({ rooms: v })} placeholder="e.g. 12" min={1} />
            </FieldGroup>
            <FieldGroup label={t("bedCapacityLabel")}>
              <NumberInput value={data.bedCapacity} onChange={(v) => updateField({ bedCapacity: v })} placeholder="e.g. 30" min={1} />
            </FieldGroup>
          </div>

          <div className="space-y-4 border-t border-border/50 pt-5">
            <p className="text-sm font-semibold">{t("annualActivity")}</p>
            <FieldGroup label={t("guestNightsLabel")}>
              <NumberInput value={data.guestNights} onChange={(v) => updateField({ guestNights: v })} placeholder="e.g. 3200" min={0} />
            </FieldGroup>
            <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/50 px-4 py-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-black" />
              <div className="text-sm text-black leading-relaxed">
                <p className="font-medium text-foreground/80 mb-1">{t("guestNightsCalcTitle")}</p>
                <p>{t("guestNightsCalcBody")}</p>
              </div>
            </div>
            <FieldGroup label={t("avgPriceNight")}>
              <NumberInput value={data.pricePerNight} onChange={(v) => updateField({ pricePerNight: v })} placeholder="e.g. 85" min={0} />
            </FieldGroup>
          </div>

          <div className="border-t border-border/50 pt-5">
            <FoodServiceSection data={data} updateField={updateField} />
          </div>
        </>
      )}

      {/* ── Experience types (B/C) */}
      {showExp && (
        <div className="space-y-4">
          {showAccom && <div className="border-t border-border/50" />}

          {/* Subcategories */}
          <div>
            <p className="text-sm font-semibold">{t("experienceSubcategories")}</p>
            <p className="text-xs text-black mt-0.5">{t("experienceSubcategoriesHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {EXPERIENCE_SUBCATEGORIES_MERGED.map((sub) => {
              const isSelected = selectedExp.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() =>
                    updateField({
                      experienceTypes: isSelected
                        ? selectedExp.filter((s) => s !== sub.id)
                        : [...selectedExp, sub.id],
                    })
                  }
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-foreground bg-secondary shadow-sm"
                      : "border-border hover:border-foreground/30 bg-background"
                  }`}
                >
                  <span className="text-2xl block mb-2">{sub.icon}</span>
                  <p className="text-sm font-semibold leading-tight">{sub.label}</p>
                  <p className="text-xs text-black mt-1 leading-snug">{sub.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Visitor-days */}
          <div className="space-y-3 border-t border-border/50 pt-5">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold">{t("visitorDaysLabel")}</p>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button type="button" className="text-black/60 hover:text-black transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-background text-foreground border border-border shadow-md max-w-[280px] text-sm leading-relaxed py-3 px-4"
                >
                  {t("visitorDaysTooltip")}
                </TooltipContent>
              </Tooltip>
            </div>
            <NumberInput
              value={data.visitorDays}
              onChange={(v) => updateField({ visitorDays: v })}
              placeholder="e.g. 1600"
              unit="visitor-days"
              min={0}
            />
            <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/50 px-4 py-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-black" />
              <p className="text-sm text-black leading-relaxed">
                <span className="font-semibold text-foreground">{t("visitorDayDef")}</span>{" "}
                {t("visitorDayCalc")}
              </p>
            </div>
          </div>

          {/* Food service for B */}
          {isPureExp && (
            <div className="border-t border-border/50 pt-5">
              <FoodServiceSection data={data} updateField={updateField} />
            </div>
          )}
        </div>
      )}

      {/* Revenue split (C only) */}
      {showSplit && (
        <div className="space-y-4 border-t border-border/50 pt-5">
          <p className="text-sm font-semibold">{t("revenueSplitTitle")}</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label={t("revenueSplitAccomPct")}>
              <NumberInput value={data.revenueSplitAccommodationPct} onChange={(v) => updateField({ revenueSplitAccommodationPct: v })} placeholder="e.g. 60" min={0} max={100} />
            </FieldGroup>
            <FieldGroup label={t("revenueSplitExpPct")}>
              <NumberInput value={data.revenueSplitExperiencePct} onChange={(v) => updateField({ revenueSplitExperiencePct: v })} placeholder="e.g. 40" min={0} max={100} />
            </FieldGroup>
          </div>
          {data.revenueSplitAccommodationPct != null && data.revenueSplitExperiencePct != null && Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct) !== 100 && (
            <p className="text-sm text-amber-600">
              {t("revenueSplitMustSum", { current: Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct) })}
            </p>
          )}
        </div>
      )}
    </StepShell>
  );
}

// ── Photos ────────────────────────────────────────────────────────────────────

export function PhotosStep({ data, updateField, shell }: StepProps) {
  const t = useTranslations("onboarding.profile.photos");
  const photos = data.photoRefs ?? [];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    // Always sync from backend on mount — ensures DB and UI are consistent
    // regardless of whether local draft/store has photos or is empty.
    // Only update state on success; preserve existing state on any fetch failure.
    fetchCurrentPhotos((url) => fetch(url).then((r) => ({
      ok: r.ok,
      json: () => r.json(),
    }))).then((result) => {
      if (result.ok) {
        setSignedUrls(result.signedUrls);
        updateField({ photoRefs: result.refs });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    setError(null);

    try {
      await uploadPhotoBatch(files, photos, {
      presign: (body) =>
        fetch("/api/v1/storage/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(async (r) => ({ ok: r.ok, status: r.status, json: () => r.json() })),

      putToStorage: (url, blob, contentType) =>
        fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: blob }),

      confirmPhoto: (body) =>
        fetch("/api/v1/operator/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(async (r) => ({ ok: r.ok, status: r.status, json: () => r.json() })),

      setCover: (id) => {
        fetch(`/api/v1/operator/photos/${id}/set-cover`, { method: "POST" }).catch(() => {});
      },

      cleanupOrphan: (key) => {
        fetch(`/api/v1/storage/presign?key=${encodeURIComponent(key)}`, { method: "DELETE" }).catch(() => {});
      },

      onPhotoSaved: (ref, url, allPhotos) => {
        setSignedUrls((prev) => ({ ...prev, [ref.id]: url }));
        updateField({ photoRefs: allPhotos });
      },

      onError: (msg) => setError(msg),

      sha256hex: async (buffer) => {
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        return Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      },
    });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/operator/photos/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Delete failed (${res.status})`);
      }
    } catch (err) {
      console.error("[photos] delete failed", err);
    }
    setSignedUrls((prev) => { const next = { ...prev }; delete next[id]; return next; });
    const next = photos.filter((p) => p.id !== id);
    if (next.length > 0 && !next.some((p) => p.isCover)) {
      next[0] = { ...next[0], isCover: true };
    }
    updateField({ photoRefs: next });
  };

  const setCover = async (id: string) => {
    try {
      await fetch(`/api/v1/operator/photos/${id}/set-cover`, { method: "POST" });
    } catch (err) {
      console.error("[photos] set-cover failed", err);
    }
    updateField({
      photoRefs: photos.map((p) => ({ ...p, isCover: p.id === id })),
    });
  };

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Photo grid + upload slot */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((p) => (
          <div
            key={p.id}
            className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3] group"
          >
            {signedUrls[p.id] ? (
              <img
                src={signedUrls[p.id]}
                alt={p.fileName ?? "Photo"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted animate-pulse" />
            )}

            {/* Cover badge */}
            {p.isCover && (
              <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-foreground text-background px-2 py-0.5 rounded">
                {t("coverBadge")}
              </span>
            )}

            {/* Hover actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
              {!p.isCover && (
                <button
                  type="button"
                  onClick={() => setCover(p.id)}
                  className="text-[11px] font-semibold text-white bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 transition-colors"
                >
                  {t("setCover")}
                </button>
              )}
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                className="text-[11px] font-semibold text-white bg-white/20 hover:bg-red-500/70 rounded-lg px-3 py-1 transition-colors"
              >
                {t("remove")}
              </button>
            </div>
          </div>
        ))}

        {/* Upload slot */}
        <label className={`rounded-xl border-2 border-dashed border-border hover:border-foreground/40 bg-background hover:bg-muted/20 transition-all cursor-pointer aspect-[4/3] flex flex-col items-center justify-center gap-2 text-black ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            className="sr-only"
            onChange={handleFileInput}
          />
          {uploading ? (
            <>
              <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-xs font-medium">{t("uploading")}</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-xs font-medium">{t("addPhotos")}</span>
            </>
          )}
        </label>
      </div>

      {/* Image guidelines */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-black shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          {t("guidelinesTitle")}
        </div>
        <ul className="text-xs text-black space-y-1 list-disc list-inside">
          <li><strong>{t("guidelineRatio")}</strong></li>
          <li>{t("guidelineResize")}</li>
          <li>{t("guidelineFormat")}</li>
          <li>{t("guidelineDashboard")}</li>
        </ul>
      </div>

      <Tip icon="🎨">
        {t("photoTip")}
      </Tip>
    </StepShell>
  );
}
