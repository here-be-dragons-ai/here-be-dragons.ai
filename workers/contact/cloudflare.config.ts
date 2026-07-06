import { defineWorker } from "wrangler/experimental-config";

export default defineWorker({
  name: "hbd-contact",
  compatibilityDate: "2026-07-01",
  entrypoint: "./src/index.js",
  domains: ["api.here-be-dragons.ai"],
  workersDev: true,
  env: {
    // Secret values are set out of band (cf workers secrets update <NAME>
    // --script-name hbd-contact --text ...); declaring them here makes
    // deploys inherit the stored values instead of dropping them.
    AIRTABLE_TOKEN: { type: "secret" },
    AIRTABLE_BASE_ID: { type: "secret" },
    AIRTABLE_TABLE_NAME: { type: "text", value: "Contacts" },
  },
});
