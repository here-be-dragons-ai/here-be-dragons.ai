import { defineWorker } from "wrangler/experimental-config";

export default defineWorker({
  name: "hbd-staging",
  compatibilityDate: "2026-07-01",
  entrypoint: "./src/index.js",
  domains: ["staging.here-be-dragons.ai"],
  workersDev: false,
  assets: {
    htmlHandling: "auto-trailing-slash",
    notFoundHandling: "404-page",
    // Route every request through the Worker so Basic Auth runs first.
    runWorkerFirst: true,
  },
  env: {
    ASSETS: { type: "assets" },
    // Set out of band: cf workers secrets update STAGING_PASSWORD
    //   --script-name hbd-staging --text ...
    STAGING_PASSWORD: { type: "secret" },
  },
});
