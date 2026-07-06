import { defineWorker } from "wrangler/experimental-config";

export default defineWorker({
  name: "hbd-contact",
  compatibilityDate: "2026-07-01",
  entrypoint: "./src/index.js",
  domains: ["api.here-be-dragons.ai"],
  workersDev: true,
  env: {
    // Secrets AIRTABLE_TOKEN and AIRTABLE_BASE_ID are managed out of band:
    //   cf workers secrets update <NAME> --script-name hbd-contact --body '...'
    AIRTABLE_TABLE_NAME: { type: "text", value: "Contacts" },
  },
});
