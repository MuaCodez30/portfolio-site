import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://muaataz.com",
  build: { assets: "assets" },
});
