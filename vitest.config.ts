/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "cloudflare:workers": new URL("test/stubs/cloudflare-workers.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    // Bundle the OAuth provider so its `cloudflare:workers` import hits the alias.
    server: { deps: { inline: ["@cloudflare/workers-oauth-provider"] } },
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
