import { useState, useEffect } from "react";
import type { ReactNode, ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { Building2, Mountain, Sparkles, Info, HelpCircle, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import { StepShell } from "../shell";
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
  const typeOptions = [
    {
      key: "A" as const,
      label: "Accommodation",
      desc: "Hotel, guesthouse, hostel, BnB, glamping, eco-lodge, surf lodge",
      badge: "guest-nights",
    },
    {
      key: "B" as const,
      label: "Experience / Tours",
      desc: "Day tours, workshops, guided activities, photography tours, boat trips",
      badge: "visitor-days",
    },
    {
      key: "C" as const,
      label: "Combined",
      desc: "Both accommodation AND experiences — scored using accommodation bounds",
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
      title="What type of operation do you run?"
      subtitle="This determines which questions we'll ask you. Accommodation operators are benchmarked per guest-night, experience operators per visitor-day."
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
                  <span className="text-[10px] font-medium text-muted-foreground border border-border/60 rounded-full px-2 py-0.5 leading-none whitespace-nowrap">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
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
            Does your operation include any overnight accommodation that guests pay for?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() =>
                updateField({ _accomGateWarn: true })
              }
              className="rounded-xl px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              Yes
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
              No
            </button>
          </div>
          {data._accomGateWarn && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 space-y-3">
              <p className="text-sm text-destructive">
                It looks like you may be a combined operator. Please select Type C (Both).
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
                Go back and select Type C
              </button>
            </div>
          )}
        </div>
      )}

      {confirmedNoAccom && (
        <div className="rounded-xl bg-secondary border border-primary/30 p-3 flex items-center gap-2">
          <span className="text-primary">✓</span>
          <span className="text-sm text-primary">
            Confirmed: no paid accommodation
          </span>
        </div>
      )}

      {/* Info box */}
      <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-surface/20 px-4 py-4">
        <Info className="w-[15px] h-[15px] shrink-0 text-muted-foreground/70 mt-px" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground leading-relaxed">
          This choice affects all scoring benchmarks. Accommodation operators are measured per guest-night; experience operators per visitor-day with lower thresholds.
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
      territories.find((t) => region && t.name.toLowerCase() === region) ??
      territories.find((t) => country && t.country?.toLowerCase() === country);

    const madeira = territories.find((t) => t.name.toLowerCase() === "madeira");

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
      title="About your business"
      subtitle="These details are required for publication but are not scored."
      topIcon={topIcon}
    >
      {floatingGps}

      {/* Business identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Legal / registered name">
          <input
            type="text"
            value={data.legalName ?? ""}
            onChange={(e) => updateField({ legalName: e.target.value })}
            className={inputCls}
            placeholder="e.g. Green Lodge Lda"
          />
        </FieldGroup>
        <FieldGroup label="Trading / brand name (optional)">
          <input
            type="text"
            value={data.tradingName ?? ""}
            onChange={(e) => updateField({ tradingName: e.target.value })}
            className={inputCls}
            placeholder="e.g. The Green Lodge"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Website (optional)">
          <input
            type="url"
            value={data.website ?? ""}
            onChange={(e) => updateField({ website: e.target.value })}
            className={inputCls}
            placeholder="https://"
          />
        </FieldGroup>
        <FieldGroup label="Year operations started">
          <NumberInput
            value={data.yearOperationStart}
            onChange={(v) => updateField({ yearOperationStart: v })}
            placeholder="e.g. 2018"
            min={1900}
            max={new Date().getFullYear()}
          />
        </FieldGroup>
      </div>

      {/* Location section */}
      <div className="border-t border-border/50 pt-6 space-y-4">
        <p className="text-sm font-semibold">Location</p>

        <FieldGroup
          label={data.operatorType === "B" ? "Meeting point / base address" : "Full address"}
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
          />
        </FieldGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Destination / region">
            <input
              type="text"
              value={data.destinationRegion ?? ""}
              onChange={(e) => updateField({ destinationRegion: e.target.value })}
              className={inputCls}
              placeholder="e.g. Madeira"
            />
          </FieldGroup>
          <FieldGroup label="Country">
            <input
              type="text"
              value={data.country ?? ""}
              onChange={(e) => updateField({ country: e.target.value })}
              className={inputCls}
              placeholder="e.g. Portugal"
            />
          </FieldGroup>
        </div>

        {data.referenceDpi === true && (data.destinationRegion || data.country) && (
          <div className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm  leading-relaxed">
              We do not yet have a DPI calculated for this destination.
              The current calculation uses Madeira as a reference territory, so the results may not fully reflect your local market.
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
  { value: "sole-proprietor", label: "Sole proprietor" },
  { value: "local-company",   label: "Local company" },
  { value: "partnership",     label: "Partnership" },
  { value: "private-company", label: "Private company" },
  { value: "public-company",  label: "Public company / group" },
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
  const ownershipType = data.ownershipType ?? "";
  const isVariantA    = VARIANT_A.has(ownershipType);
  const isVariantB    = VARIANT_B.has(ownershipType);
  const isChain       = data.isChainMember === true;

  return (
    <div className="border-t border-border/50 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <span className="text-muted-foreground mt-0.5">🔒</span>
        <div>
          <p className="text-sm font-semibold">Ownership</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This information is confidential and protected under our NDA
          </p>
        </div>
      </div>

      {/* 1. Ownership type */}
      <FieldGroup label="Ownership type">
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
          <option value="">— Select —</option>
          {OWNERSHIP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </FieldGroup>

      {/* Variant A — sole proprietor / local company */}
      {isVariantA && (
        <>
          {/* 2A. Do you live within the destination region? */}
          <FieldGroup label="Do you live within the destination region?">
            <TogglePair
              value={data.ownerLivesLocally}
              trueLabel="Yes — I/we live locally"
              falseLabel="No — based elsewhere"
              onChange={(v) => updateField({ ownerLivesLocally: v })}
            />
          </FieldGroup>

          {/* 3A. Chain toggle */}
          <ChainToggle isChain={isChain} onToggle={() =>
            updateField({ isChainMember: !isChain, chainName: isChain ? undefined : data.chainName })
          } />
          {isChain && (
            <FieldGroup label="Chain / group name">
              <input
                type="text"
                value={data.chainName ?? ""}
                onChange={(e) => updateField({ chainName: e.target.value })}
                className={inputCls}
                placeholder="Name of the chain or group"
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
                % of equity owned by local residents
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
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 3B. Chain toggle */}
          <ChainToggle isChain={isChain} onToggle={() =>
            updateField({ isChainMember: !isChain, chainName: isChain ? undefined : data.chainName })
          } />
          {isChain && (
            <FieldGroup label="Chain / group name">
              <input
                type="text"
                value={data.chainName ?? ""}
                onChange={(e) => updateField({ chainName: e.target.value })}
                className={inputCls}
                placeholder="Name of the chain or group"
              />
            </FieldGroup>
          )}
        </>
      )}
    </div>
  );
}

function ChainToggle({ isChain, onToggle }: { isChain: boolean; onToggle: () => void }) {
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
      <span className="text-sm font-medium">Part of a hotel chain or group</span>
    </div>
  );
}

// ── Accommodation ─────────────────────────────────────────────────────────────

const ACCOM_CATEGORIES = [
  { id: "hotel", label: "Hotel" },
  { id: "guesthouse", label: "Guesthouse / B&B" },
  { id: "hostel", label: "Hostel" },
  { id: "eco-lodge", label: "Eco-lodge" },
  { id: "surf-lodge", label: "Surf Lodge" },
  { id: "glamping", label: "Glamping" },
  { id: "farm-stay", label: "Farm stay" },
];

export function AccommodationStep({
  data,
  updateField,
  shell,
}: StepProps) {
  const selectedCat = data.accommodationCategory ?? "";
  return (
    <StepShell
      {...shell}
      title="Property details"
      subtitle="Tell us about your accommodation — this helps us set the right benchmarks."
    >
      <FieldGroup label="Property type" hint="Select the category that best describes your property.">
        <div className="flex flex-wrap gap-2">
          {ACCOM_CATEGORIES.map((cat) => (
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
        <FieldGroup label="Number of rooms" hint="Rentable sleeping rooms.">
          <NumberInput
            value={data.rooms}
            onChange={(v) => updateField({ rooms: v })}
            placeholder="e.g. 12"
            min={1}
          />
        </FieldGroup>
        <FieldGroup label="Bed capacity" hint="Maximum simultaneous guests.">
          <NumberInput
            value={data.bedCapacity}
            onChange={(v) => updateField({ bedCapacity: v })}
            placeholder="e.g. 24"
            min={1}
          />
        </FieldGroup>
      </div>

      <FieldGroup
        label="Food service"
        hint="What F&B service do you provide to guests?"
      >
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: "full_restaurant", label: "Full restaurant" },
            { id: "breakfast_only", label: "Breakfast only" },
            { id: "snacks_bar", label: "Snacks / bar" },
            { id: "no_food", label: "No food service" },
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
              {fs.label}
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
  const selected = data.experienceTypes ?? [];
  return (
    <StepShell
      {...shell}
      title="Experience details"
      subtitle="What kind of experiences or tours do you offer? Select all that apply."
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
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                {sub.desc}
              </p>
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select at least one experience type.
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
  return (
    <StepShell
      {...shell}
      title="Ownership structure"
      subtitle="Understanding who owns your business and how it's operated."
    >
      <FieldGroup
        label="Ownership type"
        hint="How is the business legally structured?"
      >
        <select
          value={data.ownershipType ?? ""}
          onChange={(e) => updateField({ ownershipType: e.target.value || undefined })}
          className={inputCls}
        >
          <option value="">— Select —</option>
          <option value="sole-proprietor">Sole proprietor</option>
          <option value="partnership">Partnership</option>
          <option value="family-business">Family business</option>
          <option value="community-owned">Community-owned</option>
          <option value="cooperative">Cooperative</option>
          <option value="ngo">NGO / Non-profit</option>
          <option value="private-limited">Private limited company</option>
          <option value="other">Other</option>
        </select>
      </FieldGroup>
      <FieldGroup
        label="Local equity %"
        hint="Percentage of equity held by residents within 50 km of your operation."
      >
        <NumberInput
          value={data.localEquityPct}
          onChange={(v) => updateField({ localEquityPct: v })}
          placeholder="e.g. 100"
          min={0}
          max={100}
        />
      </FieldGroup>
      <FieldGroup label="Part of a chain or group?">
        <TogglePair
          value={data.isChainMember === true ? true : data.isChainMember === false ? false : undefined}
          trueLabel="Chain / Group member"
          falseLabel="Independent"
          onChange={(v) => updateField({ isChainMember: v, chainName: v ? data.chainName : undefined })}
        />
      </FieldGroup>
      {data.isChainMember && (
        <FieldGroup label="Chain / group name">
          <input
            type="text"
            value={data.chainName ?? ""}
            onChange={(e) => updateField({ chainName: e.target.value })}
            className={inputCls}
            placeholder="Name of the chain or group"
          />
        </FieldGroup>
      )}
      <FieldGroup
        label="Are you a solo / owner-operator?"
        hint="If yes, employment metrics default to 100% and you can skip employment fields."
      >
        <TogglePair
          value={data.soloOperator}
          trueLabel="Yes — solo operator"
          falseLabel="No — I have staff"
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
  return (
    <StepShell
      {...shell}
      title="Activity data"
      subtitle="The scale of your operation. These figures normalise your intensity metrics per guest."
    >
      {data.operatorType !== "B" && (
        <FieldGroup
          label="Total guest-nights"
          hint="Sum of nights sold to guests over the 12-month assessment period."
        >
          <NumberInput
            value={data.guestNights}
            onChange={(v) => updateField({ guestNights: v })}
            placeholder="e.g. 5 000"
            min={0}
          />
        </FieldGroup>
      )}
      {data.operatorType !== "A" && (
        <FieldGroup
          label="Total visitor-days"
          hint="Number of individual day-visits / participations in your experiences."
        >
          <NumberInput
            value={data.visitorDays}
            onChange={(v) => updateField({ visitorDays: v })}
            placeholder="e.g. 2 000"
            min={0}
          />
        </FieldGroup>
      )}
      {data.operatorType === "C" && (
        <>
          <FieldGroup
            label="Revenue split — accommodation %"
            hint="Proportion of total annual revenue from accommodation (must sum to 100% with experience)."
          >
            <NumberInput
              value={data.revenueSplitAccommodationPct}
              onChange={(v) => updateField({ revenueSplitAccommodationPct: v })}
              placeholder="e.g. 60"
              min={0}
              max={100}
            />
          </FieldGroup>
          <FieldGroup label="Revenue split — experience %">
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
                Revenue split must sum to 100% (currently{" "}
                {Math.round(
                  data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct
                )}
                %).
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
    label: "Full restaurant / kitchen",
    desc: "Full meals, menu, in-house cooking",
  },
  {
    id: "breakfast_only" as const,
    label: "Breakfast only",
    desc: "Continental or cooked breakfast included",
  },
  {
    id: "snacks_bar" as const,
    label: "Snacks / bar service",
    desc: "Light food, drinks, or minibar",
  },
  {
    id: "no_food" as const,
    label: "No food service",
    desc: "Guests eat elsewhere or self-cater",
  },
];

function FoodServiceSection({
  data,
  updateField,
}: {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold">Do you serve food on-site?</p>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-background text-foreground border border-border shadow-md max-w-[280px] text-sm leading-relaxed py-3 px-4"
          >
            This helps us tailor the procurement section — if you don&apos;t serve food, we won&apos;t ask about food &amp; beverage sourcing.
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
            <p className="text-base font-semibold">{fs.label}</p>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{fs.desc}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/50 px-4 py-3">
        <span className="text-base shrink-0 mt-0.5">🌿</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Food &amp; agritourism tip:</span>{" "}
          Operators with on-site kitchens can significantly boost their P2 score by sourcing from local farms and producers within 100 km. We&apos;ll ask about this in the procurement section.
        </p>
      </div>
    </div>
  );
}

export function OperationActivityStep({ data, updateField, shell }: StepProps) {
  const selectedExp = data.experienceTypes ?? [];
  const showAccom = data.operatorType === "A" || data.operatorType === "C";
  const showExp   = data.operatorType === "B" || data.operatorType === "C";
  const showSplit  = data.operatorType === "C";
  const isPureExp = data.operatorType === "B";

  const topIcon = isPureExp ? (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <Mountain className="w-6 h-6 text-muted-foreground" />
    </div>
  ) : (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <Building2 className="w-6 h-6 text-muted-foreground" />
    </div>
  );

  return (
    <StepShell
      {...shell}
      title={isPureExp ? "Experience details" : "Property & activity details"}
      subtitle="Tell us about your operation and its annual activity."
      topIcon={topIcon}
    >
      {/* ── Accommodation details (A/C) */}
      {showAccom && (
        <>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Accommodation categories</p>
              <p className="text-xs text-muted-foreground mt-0.5">Select all that apply</p>
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
            <FieldGroup label="Number of rooms / units">
              <NumberInput value={data.rooms} onChange={(v) => updateField({ rooms: v })} placeholder="e.g. 12" min={1} />
            </FieldGroup>
            <FieldGroup label="Total bed capacity">
              <NumberInput value={data.bedCapacity} onChange={(v) => updateField({ bedCapacity: v })} placeholder="e.g. 30" min={1} />
            </FieldGroup>
          </div>

          <div className="space-y-4 border-t border-border/50 pt-5">
            <p className="text-sm font-semibold">Annual activity</p>
            <FieldGroup label="Total guest-nights (last 12 months)">
              <NumberInput value={data.guestNights} onChange={(v) => updateField({ guestNights: v })} placeholder="e.g. 3200" min={0} />
            </FieldGroup>
            <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/50 px-4 py-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground/80 mb-1">How to calculate guest-nights</p>
                <p>Guest-nights = number of guests × number of nights stayed. For example, 2 guests staying 3 nights = 6 guest-nights.</p>
              </div>
            </div>
            <FieldGroup label="Average price per night (€)">
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
            <p className="text-sm font-semibold">Experience subcategories</p>
            <p className="text-xs text-muted-foreground mt-0.5">Select all that apply</p>
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
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Visitor-days */}
          <div className="space-y-3 border-t border-border/50 pt-5">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold">Total visitor-days (last 12 months)</p>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-background text-foreground border border-border shadow-md max-w-[280px] text-sm leading-relaxed py-3 px-4"
                >
                  Count each participant per day. Half-day and short sessions are weighted fractionally.
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
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Visitor-day = 8 hours of activity per participant.</span>{" "}
                Full day (8h) → 1.00 · Half day (4h) → 0.50 · Short session (2h) → 0.25
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
          <p className="text-sm font-semibold">Revenue split</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Accommodation %">
              <NumberInput value={data.revenueSplitAccommodationPct} onChange={(v) => updateField({ revenueSplitAccommodationPct: v })} placeholder="e.g. 60" min={0} max={100} />
            </FieldGroup>
            <FieldGroup label="Experience %">
              <NumberInput value={data.revenueSplitExperiencePct} onChange={(v) => updateField({ revenueSplitExperiencePct: v })} placeholder="e.g. 40" min={0} max={100} />
            </FieldGroup>
          </div>
          {data.revenueSplitAccommodationPct != null && data.revenueSplitExperiencePct != null && Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct) !== 100 && (
            <p className="text-sm text-amber-600">
              Must sum to 100% (currently {Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct)}%).
            </p>
          )}
        </div>
      )}
    </StepShell>
  );
}

// ── Photos ────────────────────────────────────────────────────────────────────

type PhotoRef = NonNullable<OnboardingData["photoRefs"]>[number];

export function PhotosStep({ data, updateField, shell }: StepProps) {
  const photos = data.photoRefs ?? [];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (photos.length === 0) return;
    fetch("/api/v1/operator/photos")
      .then((r) => r.json())
      .then((list: Array<{ id: string; storageKey: string; signedUrl: string; isCover: boolean; fileName?: string }>) => {
        const map: Record<string, string> = {};
        for (const p of list) map[p.id] = p.signedUrl;
        setSignedUrls(map);
        updateField({
          photoRefs: list.map((p) => ({
            id: p.id,
            url: p.storageKey,
            storageKey: p.storageKey,
            isCover: p.isCover,
            fileName: p.fileName,
          })),
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    setError(null);

    try {
      const uploaded: PhotoRef[] = [];
      const newSignedUrls: Record<string, string> = {};

      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
        const checksumHex = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const presignRes = await fetch("/api/v1/storage/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceType: "photo",
            contentType: file.type,
            sizeBytes: file.size,
            checksum: checksumHex,
          }),
        });
        if (!presignRes.ok) {
          const body = await presignRes.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed to get upload URL (${presignRes.status})`);
        }
        const { key, signedUrl: putUrl } = await presignRes.json();

        const uploadRes = await fetch(putUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: new Blob([fileBuffer], { type: file.type }),
        });
        if (!uploadRes.ok) throw new Error("File upload failed");

        const confirmRes = await fetch("/api/v1/operator/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            checksum: checksumHex,
          }),
        });
        if (!confirmRes.ok) {
          const body = await confirmRes.json().catch(() => ({}));
          throw new Error(body.error ?? `Upload failed (${confirmRes.status})`);
        }

        const photo = await confirmRes.json();
        newSignedUrls[photo.id] = photo.signedUrl;
        const isFirstPhoto = photos.length === 0 && uploaded.length === 0;
        if (isFirstPhoto) {
          await fetch(`/api/v1/operator/photos/${photo.id as string}/set-cover`, { method: "POST" }).catch(() => {});
        }
        uploaded.push({
          id: photo.id as string,
          url: photo.storageKey as string,
          storageKey: photo.storageKey as string,
          isCover: isFirstPhoto,
          fileName: photo.fileName as string | undefined,
        });
      }

      setSignedUrls((prev) => ({ ...prev, ...newSignedUrls }));
      const next = [...photos, ...uploaded];
      updateField({ photoRefs: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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
      title="Your operation, in photos"
      subtitle="Upload photos that travelers will see. The first photo becomes your cover image."
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
            <img
              src={signedUrls[p.id] ?? ""}
              alt={p.fileName ?? "Photo"}
              className="w-full h-full object-cover"
            />

            {/* Cover badge */}
            {p.isCover && (
              <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-foreground text-background px-2 py-0.5 rounded">
                Cover
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
                  Set cover
                </button>
              )}
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                className="text-[11px] font-semibold text-white bg-white/20 hover:bg-red-500/70 rounded-lg px-3 py-1 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* Upload slot */}
        <label className={`rounded-xl border-2 border-dashed border-border hover:border-foreground/40 bg-background hover:bg-muted/20 transition-all cursor-pointer aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted-foreground ${uploading ? "pointer-events-none opacity-60" : ""}`}>
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
              <span className="text-xs font-medium">Uploading…</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-xs font-medium">Add photos</span>
            </>
          )}
        </label>
      </div>

      {/* Image guidelines */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Image guidelines
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Recommended: <strong>4:3 ratio, 1200×900px minimum</strong></li>
          <li>Large images are automatically resized to 1920px max</li>
          <li>JPEG, PNG, or WebP — max 10MB per file</li>
          <li>You can add or change photos anytime from your dashboard</li>
        </ul>
      </div>

      <Tip icon="🎨">
        Don&apos;t have professional photos? No problem — share what you have and we can help you create polished visuals for your public profile.
      </Tip>
    </StepShell>
  );
}
