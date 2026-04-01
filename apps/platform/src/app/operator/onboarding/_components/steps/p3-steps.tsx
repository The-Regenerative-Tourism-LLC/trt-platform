import type { ReactNode } from "react";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import { StepShell } from "../shell";
import {
  FieldGroup,
  NumberInput,
  BandSelector,
  TogglePair,
  Tip,
  inputCls,
} from "../primitives";
import { P3_CATEGORIES } from "@/lib/constants";

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  floatingGps?: ReactNode;
}

// ── P3: Status ────────────────────────────────────────────────────────────────

export function P3StatusStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Giving back to your destination"
      subtitle="Pillar 3 measures whether tourism operators actively reinvest in the ecological, cultural, or scientific health of the places they depend on."
    >
      {floatingGps}
      <Tip icon="✨">
        This pillar is worth 30% of your GPS. Even a Status D forward commitment
        signals genuine intent and is recorded on your profile.
      </Tip>
      <div className="grid gap-2.5">
        {([
          {
            id: "A" as const,
            label: "Status A",
            desc: "Active programme with a verified institutional partner. Full P3 scoring available.",
            badge: "bg-emerald-100 text-emerald-700",
          },
          {
            id: "B" as const,
            label: "Status B",
            desc: "Active programme — institutional verification in progress. Full P3 scoring available.",
            badge: "bg-teal-100 text-teal-700",
          },
          {
            id: "C" as const,
            label: "Status C",
            desc: "Internal programme — no institutional partner yet. Traceability capped at 50.",
            badge: "bg-sky-100 text-sky-700",
          },
          {
            id: "D" as const,
            label: "Status D",
            desc: "Forward commitment — you commit to activating a programme next cycle. P3 = 0 this cycle.",
            badge: "bg-amber-100 text-amber-700",
          },
          {
            id: "E" as const,
            label: "Status E",
            desc: "No programme currently. P3 = 0. Your GPS is calculated from Pillar 1 and 2 only.",
            badge: "bg-muted text-muted-foreground",
          },
        ]).map(({ id, label, desc, badge }) => (
          <button
            key={id}
            onClick={() => updateField({ p3Status: id })}
            className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
              data.p3Status === id
                ? "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-200"
                : "border-border hover:border-emerald-300 hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}
              >
                {label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">{desc}</p>
          </button>
        ))}
      </div>
    </StepShell>
  );
}

// ── P3: Programme ─────────────────────────────────────────────────────────────

export function P3ProgrammeStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Your contribution programme"
      subtitle="Describe your regenerative contribution programme and its institutional context."
    >
      {floatingGps}
      {data.p3Status === "C" && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-1">
          <p className="text-sm font-semibold text-amber-800">
            Status C — Traceability cap
          </p>
          <p className="text-xs text-amber-700">
            Without an institutional partner, your traceability score is capped
            at 50. This limits the maximum P3 score. Consider partnering with a
            local institution to unlock full scoring.
          </p>
        </div>
      )}
      <FieldGroup
        label="Contribution category"
        hint="Select all categories that apply to your programme."
      >
        <div className="space-y-2">
          {P3_CATEGORIES.map((cat) => (
            <label
              key={cat.id}
              className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={data.p3ContributionCategories?.includes(cat.id) ?? false}
                onChange={(e) => {
                  const current = data.p3ContributionCategories ?? [];
                  updateField({
                    p3ContributionCategories: e.target.checked
                      ? [...current, cat.id]
                      : current.filter((c) => c !== cat.id),
                  });
                }}
                className="mt-0.5 accent-emerald-600"
              />
              <div>
                <div className="text-sm font-medium">{cat.label}</div>
                <div className="text-xs text-muted-foreground">{cat.description}</div>
              </div>
            </label>
          ))}
        </div>
      </FieldGroup>
      <FieldGroup
        label="Programme description"
        hint="What specifically do you do? Focus on activities, not intentions. Max 300 words."
      >
        <textarea
          value={data.p3ProgrammeDescription ?? ""}
          onChange={(e) => updateField({ p3ProgrammeDescription: e.target.value })}
          className={inputCls + " min-h-[120px] resize-y"}
          placeholder="e.g. We co-fund an annual seagrass restoration survey with the University of Algarve, contributing €4 000/year and providing 3 field days..."
        />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Programme duration">
          <select
            value={data.p3ProgrammeDuration ?? ""}
            onChange={(e) =>
              updateField({ p3ProgrammeDuration: e.target.value || undefined })
            }
            className={inputCls}
          >
            <option value="">— Select —</option>
            <option value="<1">Less than 1 year</option>
            <option value="1-3">1–3 years</option>
            <option value=">3">More than 3 years</option>
            <option value="starting">Starting now</option>
          </select>
        </FieldGroup>
        <FieldGroup label="Geographic scope">
          <select
            value={data.p3GeographicScope ?? ""}
            onChange={(e) =>
              updateField({ p3GeographicScope: e.target.value || undefined })
            }
            className={inputCls}
          >
            <option value="">— Select —</option>
            <option value="on-property">On-property only</option>
            <option value="local">Immediate local area (&lt; 5 km)</option>
            <option value="destination">Destination-wide</option>
            <option value="cross-destination">Cross-destination</option>
          </select>
        </FieldGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Annual budget (€)" hint="Amount committed per year.">
          <NumberInput
            value={data.p3AnnualBudget}
            onChange={(v) => updateField({ p3AnnualBudget: v })}
            placeholder="e.g. 5 000"
            min={0}
          />
        </FieldGroup>
        <FieldGroup label="Guests participating per year">
          <NumberInput
            value={data.p3GuestsParticipating}
            onChange={(v) => updateField({ p3GuestsParticipating: v })}
            placeholder="e.g. 200"
            min={0}
          />
        </FieldGroup>
      </div>
      <FieldGroup label="Individual or collective programme?">
        <TogglePair
          value={data.p3IsCollective}
          trueLabel="Collective (with other operators)"
          falseLabel="Individual"
          onChange={(v) => updateField({ p3IsCollective: v })}
        />
      </FieldGroup>
      {data.p3IsCollective && (
        <>
          <FieldGroup label="Collective size">
            <select
              value={data.p3CollectiveSize ?? ""}
              onChange={(e) =>
                updateField({ p3CollectiveSize: e.target.value || undefined })
              }
              className={inputCls}
            >
              <option value="">— Select —</option>
              <option value="2-4">2–4 operators</option>
              <option value="5+">5+ operators / destination-wide</option>
            </select>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Total collective budget (€)">
              <NumberInput
                value={data.p3CollectiveTotalBudget}
                onChange={(v) => updateField({ p3CollectiveTotalBudget: v })}
                placeholder="e.g. 12 000"
                min={0}
              />
            </FieldGroup>
            <FieldGroup label="Your share (%)">
              <NumberInput
                value={data.p3CollectiveSharePct}
                onChange={(v) => updateField({ p3CollectiveSharePct: v })}
                placeholder="e.g. 25"
                min={0}
                max={100}
              />
            </FieldGroup>
          </div>
        </>
      )}
      <FieldGroup
        label="Administering institution"
        hint="Name of the institution that validates your contribution, if applicable."
      >
        <input
          type="text"
          value={data.p3InstitutionName ?? ""}
          onChange={(e) => updateField({ p3InstitutionName: e.target.value })}
          className={inputCls}
          placeholder="e.g. University of Madeira"
        />
      </FieldGroup>
    </StepShell>
  );
}

// ── P3: Evidence Quality ──────────────────────────────────────────────────────

export function P3EvidenceQualityStep({
  data,
  updateField,
  shell,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Evidence quality"
      subtitle="Rate the quality of evidence supporting your regenerative contribution."
    >
      <FieldGroup
        label="Institutional traceability"
        hint="Who validates your programme? Self-reported = 0, NGO informal = 25, NGO formal = 50, academic = 75, multiple institutions = 100."
      >
        <BandSelector
          values={[0, 25, 50, 75, 100]}
          labels={["0 Self-reported", "25 NGO informal", "50 NGO formal", "75 Academic", "100 Multi-institution"]}
          selected={data.p3Traceability}
          onSelect={(v) => updateField({ p3Traceability: v })}
        />
      </FieldGroup>
      <FieldGroup
        label="Additionality"
        hint="Would this programme exist without tourism revenue? 0 = no additionality, 100 = fully additional."
      >
        <BandSelector
          values={[0, 25, 50, 75, 100]}
          labels={["0 None", "25 Low", "50 Moderate", "75 High", "100 Full"]}
          selected={data.p3Additionality}
          onSelect={(v) => updateField({ p3Additionality: v })}
        />
      </FieldGroup>
      <FieldGroup
        label="Continuity & commitment"
        hint="How embedded and long-term is this programme? 0 = ad hoc, 100 = long-term embedded."
      >
        <BandSelector
          values={[0, 25, 50, 75, 100]}
          labels={["0 Ad hoc", "25 Initial", "50 Developing", "75 Established", "100 Long-term"]}
          selected={data.p3Continuity}
          onSelect={(v) => updateField({ p3Continuity: v })}
        />
      </FieldGroup>
    </StepShell>
  );
}

// ── P3: Forward Commitment ────────────────────────────────────────────────────

export function P3ForwardCommitmentStep({
  data,
  updateField,
  shell,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Forward commitment"
      subtitle="Declare your commitment to activating a regenerative programme in a future cycle."
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
        <p className="text-sm font-semibold text-amber-800">Status D — Forward Commitment</p>
        <p className="text-xs text-amber-700">
          Your P3 score will be 0 this cycle. Your GPS is computed from Pillar 1 and Pillar 2 only,
          renormalised to 0–100. A Forward Commitment Record will be created upon submission.
        </p>
      </div>
      <FieldGroup
        label="Preferred contribution category"
        hint="Which category fits your territory and operation best?"
      >
        <select
          value={data.forwardCommitmentPreferredCategory ?? ""}
          onChange={(e) =>
            updateField({ forwardCommitmentPreferredCategory: e.target.value || undefined })
          }
          className={inputCls}
        >
          <option value="">— Select —</option>
          {P3_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </FieldGroup>
      <FieldGroup
        label="Territory context"
        hint="Describe the ecological, cultural, or scientific need in your territory. Max 200 words."
      >
        <textarea
          value={data.forwardCommitmentTerritoryContext ?? ""}
          onChange={(e) => updateField({ forwardCommitmentTerritoryContext: e.target.value })}
          className={inputCls + " min-h-[100px] resize-y"}
          placeholder="Why does this category fit your territory?"
        />
      </FieldGroup>
      <FieldGroup
        label="Preferred institution type"
        hint="What kind of institution do you intend to partner with?"
      >
        <select
          value={data.forwardCommitmentPreferredInstitutionType ?? ""}
          onChange={(e) =>
            updateField({ forwardCommitmentPreferredInstitutionType: e.target.value || undefined })
          }
          className={inputCls}
        >
          <option value="">— Select —</option>
          <option value="NGO">NGO / Non-profit</option>
          <option value="University">University / Research institution</option>
          <option value="Government">Government / Public agency</option>
          <option value="Community">Community organisation</option>
          <option value="Other">Other</option>
        </select>
      </FieldGroup>
      <FieldGroup
        label="Target activation cycle"
        hint="Which assessment cycle do you commit to having an active partner?"
      >
        <NumberInput
          value={data.forwardCommitmentTargetCycle}
          onChange={(v) => updateField({ forwardCommitmentTargetCycle: v })}
          placeholder="e.g. 2"
          min={2}
        />
      </FieldGroup>
      <FieldGroup label="Authorised signatory" hint="Full legal name of the person signing this commitment.">
        <input
          type="text"
          value={data.forwardCommitmentSignatory ?? ""}
          onChange={(e) => updateField({ forwardCommitmentSignatory: e.target.value })}
          className={inputCls}
          placeholder="e.g. Maria Silva"
        />
      </FieldGroup>
      <FieldGroup label="Signature date">
        <input
          type="date"
          value={data.forwardCommitmentSignedAt ?? ""}
          onChange={(e) =>
            updateField({ forwardCommitmentSignedAt: e.target.value || undefined })
          }
          max={new Date().toISOString().slice(0, 10)}
          className={inputCls}
        />
      </FieldGroup>
    </StepShell>
  );
}
