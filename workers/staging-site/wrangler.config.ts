import { defineWranglerConfig } from "wrangler/experimental-config";

// Tooling-side settings; the staging Worker serves the same static site
// that GitHub Pages serves in production.
export default defineWranglerConfig({
  assetsDirectory: "../../public",
});
