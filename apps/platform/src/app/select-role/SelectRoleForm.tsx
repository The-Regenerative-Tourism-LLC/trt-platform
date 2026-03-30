"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { selectRoleAction } from "./actions";

type Role = "operator" | "traveler";

const ROLES = [
  {
    value: "operator" as Role,
    label: "Tourism Operator",
    description:
      "I manage a lodge, tour, or experience and want to get my Green Passport Score.",
    features: ["GPS assessment", "DPI context", "Public passport"],
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    value: "traveler" as Role,
    label: "Traveler",
    description:
      "I want to discover and book regenerative travel experiences.",
    features: ["Impact passport", "Verified operators", "Choice scoring"],
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
        />
      </svg>
    ),
  },
];

export function SelectRoleForm() {
  const { update } = useSession();
  const [selected, setSelected] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!selected) {
      setError("Please choose a role to continue.");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        // The action is idempotent: if the user already had a role from a
        // previous partial attempt it recovers the missing profile instead of
        // throwing "Role already assigned".
        await selectRoleAction({ role: selected });

        // Passing `{}` (any truthy value) forces Auth.js to POST to
        // /api/auth/session, which triggers trigger === "update" in the jwt
        // callback and reissues the cookie with the new role and
        // needsRoleSelection: false. Calling update() with no argument sends
        // a GET instead, which skips the jwt callback and leaves the old JWT
        // cookie in place — causing middleware to redirect back here.
        // update() resolves with the refreshed Session, which we use to
        // determine the correct destination (the action may have found an
        // existing role different from the one the user just clicked).
        const newSession = await update({});
        const effectiveRole = newSession?.user?.roles?.[0];

        // Full browser navigation so the next request carries the new cookie.
        // router.push() risks the middleware seeing stale client-side state.
        window.location.href =
          effectiveRole === "operator" ? "/operator/onboarding" : "/traveler/discover";
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {ROLES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelected(option.value)}
            className={`w-full flex gap-5 items-start p-5 rounded-2xl border-2 text-left transition-all ${
              selected === option.value
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span
              className={`mt-0.5 flex-shrink-0 ${
                selected === option.value
                  ? "text-emerald-600"
                  : "text-gray-400"
              }`}
            >
              {option.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">
                  {option.label}
                </span>
                {selected === option.value && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {option.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {option.features.map((f) => (
                  <span
                    key={f}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      selected === option.value
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected || isPending}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isPending ? (
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : null}
        {isPending ? "Setting up your account…" : "Continue"}
      </button>
    </div>
  );
}
