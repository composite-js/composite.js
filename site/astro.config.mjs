import { defineConfig } from "astro/config";

const env = globalThis.process?.env ?? {};
const base = env.SITE_BASE_PATH || "/";
const site = env.SITE_URL || undefined;

export default defineConfig({
  base,
  devToolbar: {
    enabled: false,
  },
  site,
});
