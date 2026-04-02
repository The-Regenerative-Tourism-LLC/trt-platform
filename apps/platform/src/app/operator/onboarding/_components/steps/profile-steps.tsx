import type { ReactNode, ChangeEvent } from "react";
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

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  floatingGps?: ReactNode;
}

// ── Operator Type ─────────────────────────────────────────────────────────────

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

  return (
    <StepShell
      {...shell}
      title="What type of operation do you run?"
      subtitle="This determines which questions we'll ask you. Accommodation operators are benchmarked per guest-night, experience operators per visitor-day."
      isFirst
    >
      <div className="grid gap-3">
        {typeOptions.map((opt) => (
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
            className={`w-full rounded-xl border-2 p-5 text-left transition-all ${
              data.operatorType === opt.key
                ? "border-foreground bg-secondary shadow-sm ring-1 ring-primary/30"
                : "border-border hover:border-primary/40 hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base">{opt.label}</span>
              <span className="text-[10px] font-medium text-muted-foreground border border-border rounded-full px-2 py-0.5">
                {opt.badge}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{opt.desc}</div>
          </button>
        ))}
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

      <Tip icon="📊">
        This choice affects all scoring benchmarks. Accommodation operators are measured
        per guest-night; experience operators per visitor-day with lower thresholds.
      </Tip>
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
  territories: Array<{ id: string; name: string; country: string | null }>;
}) {
  return (
    <StepShell
      {...shell}
      title="About your business"
      subtitle="These details are required for publication but are not scored."
    >
      {floatingGps}
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
        <FieldGroup label="Trading / brand name" hint="Optional — the name known to guests.">
          <input
            type="text"
            value={data.tradingName ?? ""}
            onChange={(e) => updateField({ tradingName: e.target.value })}
            className={inputCls}
            placeholder="e.g. The Green Lodge"
          />
        </FieldGroup>
      </div>
      <FieldGroup label="Website" hint="Optional">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="Typical price / night (optional)" hint="Published rate in your currency.">
          <NumberInput
            value={data.pricePerNight}
            onChange={(v) => updateField({ pricePerNight: v })}
            placeholder="e.g. 120"
            min={0}
          />
        </FieldGroup>
        <FieldGroup label="Latitude (optional)" hint="WGS84 decimal degrees.">
          <NumberInput
            value={data.latitude}
            onChange={(v) => updateField({ latitude: v })}
            placeholder="e.g. 37.02"
            step={0.000001}
          />
        </FieldGroup>
        <FieldGroup label="Longitude (optional)">
          <NumberInput
            value={data.longitude}
            onChange={(v) => updateField({ longitude: v })}
            placeholder="e.g. -7.93"
            step={0.000001}
          />
        </FieldGroup>
      </div>

      {/* Location section */}
      <div className="border-t border-border/50 pt-5 space-y-4">
        <p className="text-sm font-medium text-primary">Location</p>
        <FieldGroup
          label={data.operatorType === "B" ? "Meeting point / base address" : "Full address"}
        >
          <input
            type="text"
            value={data.address ?? ""}
            onChange={(e) => updateField({ address: e.target.value })}
            className={inputCls}
            placeholder="Start typing an address…"
          />
        </FieldGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Destination / region" hint="Auto-populated from address. Editable.">
            <input
              type="text"
              value={data.destinationRegion ?? ""}
              onChange={(e) => updateField({ destinationRegion: e.target.value })}
              className={inputCls}
              placeholder="e.g. Alentejo"
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
        <FieldGroup
          label="Territory"
          hint="Select the TRT territory for destination pressure index context."
        >
          <select
            value={data.territoryId ?? ""}
            onChange={(e) => updateField({ territoryId: e.target.value || undefined })}
            className={inputCls}
          >
            <option value="">— Select territory —</option>
            {territories.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{t.country ? ` (${t.country})` : ""}
              </option>
            ))}
          </select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Primary contact name">
          <input
            type="text"
            value={data.primaryContactName ?? ""}
            onChange={(e) => updateField({ primaryContactName: e.target.value })}
            className={inputCls}
            placeholder="Full name"
          />
        </FieldGroup>
        <FieldGroup label="Primary contact email">
          <input
            type="email"
            value={data.primaryContactEmail ?? ""}
            onChange={(e) => updateField({ primaryContactEmail: e.target.value })}
            className={inputCls}
            placeholder="contact@example.com"
          />
        </FieldGroup>
      </div>
    </StepShell>
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
      <FieldGroup
        label="Assessment period end date"
        hint="The last day of the 12-month period your operational data covers."
      >
        <input
          type="date"
          value={data.assessmentPeriodEnd ?? ""}
          onChange={(e) => updateField({ assessmentPeriodEnd: e.target.value || undefined })}
          max={new Date().toISOString().slice(0, 10)}
          className={inputCls}
        />
      </FieldGroup>
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
  { id: "nature_wildlife",      label: "Nature & Wildlife",       icon: "🌿" },
  { id: "whale_watching",       label: "Whale & Dolphin Watching", icon: "🐋" },
  { id: "diving_snorkelling",   label: "Diving & Snorkelling",    icon: "🤿" },
  { id: "hiking_trekking",      label: "Hiking & Trekking",       icon: "🥾" },
  { id: "kayaking_watersports", label: "Kayaking & Water Sports", icon: "🚣" },
  { id: "cycling",              label: "Cycling & E-bike",        icon: "🚴" },
  { id: "cultural_heritage",    label: "Cultural & Heritage",     icon: "🏛️" },
  { id: "photography",          label: "Photography Tours",       icon: "📸" },
  { id: "birdwatching",         label: "Birdwatching",            icon: "🦅" },
  { id: "wellness_yoga",        label: "Wellness & Yoga",         icon: "🧘" },
  { id: "volunteering",         label: "Volunteering",            icon: "🤝" },
  { id: "food_agritourism",     label: "Food & Agritourism",      icon: "🍷" },
];

export function OperationActivityStep({ data, updateField, shell }: StepProps) {
  const selectedExp = data.experienceTypes ?? [];
  const showAccom = data.operatorType === "A" || data.operatorType === "C";
  const showExp   = data.operatorType === "B" || data.operatorType === "C";
  const showSplit  = data.operatorType === "C";

  return (
    <StepShell
      {...shell}
      title="Tell us about your operation and its annual activity"
      subtitle="This helps us set the right benchmarks and normalise your environmental data."
    >
      {/* ── Accommodation details (A/C) */}
      {showAccom && (
        <div className="space-y-4 pb-2 border-b border-border/50">
          <p className="text-sm font-semibold text-primary">Accommodation</p>
          <FieldGroup label="Property type" hint="Select the category that best describes your property.">
            <div className="flex flex-wrap gap-2">
              {ACCOM_CATEGORIES_MERGED.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateField({ accommodationCategory: cat.id })}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    data.accommodationCategory === cat.id
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
              <NumberInput value={data.rooms} onChange={(v) => updateField({ rooms: v })} placeholder="e.g. 12" min={1} />
            </FieldGroup>
            <FieldGroup label="Bed capacity" hint="Maximum simultaneous guests.">
              <NumberInput value={data.bedCapacity} onChange={(v) => updateField({ bedCapacity: v })} placeholder="e.g. 24" min={1} />
            </FieldGroup>
          </div>
          <FieldGroup label="Food service" hint="What F&B service do you provide to guests?">
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "full_restaurant", label: "Full restaurant" },
                { id: "breakfast_only",  label: "Breakfast only" },
                { id: "snacks_bar",      label: "Snacks / bar" },
                { id: "no_food",         label: "No food service" },
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
        </div>
      )}

      {/* ── Experience types (B/C) */}
      {showExp && (
        <div className="space-y-4 pb-2 border-b border-border/50">
          <p className="text-sm font-semibold text-primary">Experience types</p>
          <p className="text-xs text-muted-foreground">Select all that apply.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    isSelected
                      ? "border-foreground bg-secondary shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-muted/20"
                  }`}
                >
                  <span className="text-xl block mb-1">{sub.icon}</span>
                  <p className="text-xs font-semibold leading-tight">{sub.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ownership */}
      <div className="space-y-4 pb-2 border-b border-border/50">
        <p className="text-sm font-semibold text-primary">Ownership</p>
        <FieldGroup label="Ownership type" hint="How is the business legally structured?">
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
        <FieldGroup label="Local equity %" hint="Percentage of equity held by residents within 50 km of your operation.">
          <NumberInput value={data.localEquityPct} onChange={(v) => updateField({ localEquityPct: v })} placeholder="e.g. 100" min={0} max={100} />
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
            <input type="text" value={data.chainName ?? ""} onChange={(e) => updateField({ chainName: e.target.value })} className={inputCls} placeholder="Name of the chain or group" />
          </FieldGroup>
        )}
        <FieldGroup label="Are you a solo / owner-operator?" hint="If yes, employment metrics default to 100% and you can skip employment fields.">
          <TogglePair
            value={data.soloOperator}
            trueLabel="Yes — solo operator"
            falseLabel="No — I have staff"
            onChange={(v) => updateField({ soloOperator: v })}
          />
        </FieldGroup>
      </div>

      {/* ── Annual activity */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-primary">Annual activity</p>
        <FieldGroup label="Assessment period end date" hint="The last day of the 12-month period your operational data covers.">
          <input
            type="date"
            value={data.assessmentPeriodEnd ?? ""}
            onChange={(e) => updateField({ assessmentPeriodEnd: e.target.value || undefined })}
            max={new Date().toISOString().slice(0, 10)}
            className={inputCls}
          />
        </FieldGroup>
        {data.operatorType !== "B" && (
          <FieldGroup label="Total guest-nights" hint="Sum of nights sold to guests over the 12-month assessment period.">
            <NumberInput value={data.guestNights} onChange={(v) => updateField({ guestNights: v })} placeholder="e.g. 5 000" min={0} />
          </FieldGroup>
        )}
        {data.operatorType !== "A" && (
          <FieldGroup label="Total visitor-days" hint="Number of individual day-visits / participations in your experiences.">
            <NumberInput value={data.visitorDays} onChange={(v) => updateField({ visitorDays: v })} placeholder="e.g. 2 000" min={0} />
          </FieldGroup>
        )}
        {showSplit && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Revenue split — accommodation %" hint="Must sum to 100% with experience.">
                <NumberInput value={data.revenueSplitAccommodationPct} onChange={(v) => updateField({ revenueSplitAccommodationPct: v })} placeholder="e.g. 60" min={0} max={100} />
              </FieldGroup>
              <FieldGroup label="Revenue split — experience %">
                <NumberInput value={data.revenueSplitExperiencePct} onChange={(v) => updateField({ revenueSplitExperiencePct: v })} placeholder="e.g. 40" min={0} max={100} />
              </FieldGroup>
            </div>
            {data.revenueSplitAccommodationPct != null && data.revenueSplitExperiencePct != null && Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct) !== 100 && (
              <p className="text-sm text-amber-600">
                Revenue split must sum to 100% (currently {Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct)}%).
              </p>
            )}
          </>
        )}
      </div>
    </StepShell>
  );
}

// ── Photos (upload-like UI) ────────────────────────────────────────────────────

function newPhotoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function PhotosStep({ data, updateField, shell }: StepProps) {
  const photos = data.photoRefs ?? [];

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newRefs = files.map((f) => ({
      id: newPhotoId(),
      storageRef: `pending:${f.name}`,
      fileName: f.name,
    }));
    updateField({ photoRefs: [...photos, ...newRefs] });
    e.target.value = "";
  };

  const removePhoto = (id: string) => {
    updateField({ photoRefs: photos.filter((p) => p.id !== id) });
  };

  const setCover = (id: string) => {
    const ix = photos.findIndex((p) => p.id === id);
    if (ix <= 0) return;
    const next = [...photos];
    const [row] = next.splice(ix, 1);
    next.unshift(row);
    updateField({ photoRefs: next });
  };

  return (
    <StepShell
      {...shell}
      title="Show off your operation"
      subtitle="Add photos of your property or experiences. The first image will be your cover photo on your Green Passport profile."
    >
      {/* Upload zone */}
      <label className="block w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 transition-all cursor-pointer p-8 text-center">
        <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFileInput} />
        <div className="space-y-2">
          <div className="text-3xl">📷</div>
          <p className="text-sm font-medium text-muted-foreground">
            Click to select photos
          </p>
          <p className="text-xs text-muted-foreground/60">
            JPG, PNG, WEBP — select multiple at once
          </p>
        </div>
      </label>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{photos.length} photo{photos.length !== 1 ? "s" : ""} added</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((p, index) => (
              <div
                key={p.id}
                className={`relative rounded-xl border-2 overflow-hidden bg-muted/30 aspect-square flex flex-col items-center justify-center p-3 ${
                  index === 0 ? "border-primary" : "border-border"
                }`}
              >
                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    Cover
                  </span>
                )}
                <div className="text-2xl mb-1">🖼️</div>
                <p className="text-[10px] text-center text-muted-foreground leading-tight truncate w-full px-1">
                  {p.fileName ?? p.storageRef.replace("pending:", "")}
                </p>
                <div className="flex gap-2 mt-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => setCover(p.id)}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Set cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tip icon="💡">
        Photos are uploaded to secure storage after submission. Select your best images — your cover photo appears on your public Green Passport profile.
      </Tip>
    </StepShell>
  );
}
