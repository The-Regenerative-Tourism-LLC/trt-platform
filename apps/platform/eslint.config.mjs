import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Modules that must never be imported in frontend (client) code. */
const BACKEND_ONLY_RESTRICTED_IMPORTS = [
  {
    name: "@/lib/engine/trt-scoring-engine",
    message:
      "Scoring engine must not be imported in frontend code. Scores are computed server-side only.",
  },
  {
    name: "@/lib/engine/trt-scoring-engine/compute-score",
    message:
      "Scoring engine must not be imported in frontend code. Scores are computed server-side only.",
  },
  {
    name: "@/lib/engine/trt-scoring-engine/types",
    importNames: ["computeScore"],
    message:
      "computeScore must not be called from frontend code. Use the API instead.",
  },
  {
    name: "@/lib/snapshots/assessment-snapshot.builder",
    message:
      "Snapshot builders must not be imported in frontend code. Snapshots are constructed server-side.",
  },
  {
    name: "@/lib/snapshots/dpi-snapshot.builder",
    message:
      "Snapshot builders must not be imported in frontend code. Snapshots are constructed server-side.",
  },
  {
    name: "@/lib/methodology/default-bundle",
    message:
      "MethodologyBundle must not be accessed from frontend code. It is an engine-only input.",
  },
  {
    name: "@/lib/methodology/methodology-bundle.loader",
    message:
      "MethodologyBundle loader must not be imported in frontend code.",
  },
  {
    name: "@/lib/orchestration/scoring-orchestrator",
    message:
      "Scoring orchestrator must not be imported in frontend code. Use API routes instead.",
  },
  {
    name: "@/lib/orchestration/dpi-orchestrator",
    message:
      "DPI orchestrator must not be imported in frontend code. Use API routes instead.",
  },
  {
    name: "@/lib/db/prisma",
    message:
      "Database client must not be imported in frontend code. Use API routes for data access.",
  },
  {
    name: "@prisma/client",
    message:
      "Prisma client must not be imported in frontend code. Use API routes for data access.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ── Architecture guardrails: prevent backend imports in frontend code ──
  // NOTE: src/app/**/page.tsx is intentionally excluded — Next.js App Router
  // page.tsx files are server components by default and may access the database directly.
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/store/**/*.{ts,tsx}",
      "src/app/**/*Client.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: BACKEND_ONLY_RESTRICTED_IMPORTS,
          patterns: [
            {
              group: ["@/lib/db/*", "@/lib/db/**"],
              message:
                "Database modules must not be imported in frontend code. Use API routes for data access.",
            },
            {
              group: ["@/lib/orchestration/*", "@/lib/orchestration/**"],
              message:
                "Orchestrators must not be imported in frontend code. Use API routes instead.",
            },
            {
              group: ["@/lib/snapshots/*", "@/lib/snapshots/**"],
              message:
                "Snapshot builders must not be imported in frontend code.",
            },
            // Engine type-only imports (import type { ... }) from types.ts are
            // intentionally allowed for display components. Value imports from the
            // engine barrel and compute-score are blocked by named path rules above.
            {
              group: ["@/lib/methodology/*", "@/lib/methodology/**"],
              message:
                "Methodology modules must not be imported in frontend code.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
