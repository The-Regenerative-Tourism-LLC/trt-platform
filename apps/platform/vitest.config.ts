import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    server: {
      deps: {
        // Transform next and next-auth so Vitest uses their package.json exports correctly
        inline: [/next/, /@auth/],
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    conditions: ["node", "import", "module", "default"],
  },
});
